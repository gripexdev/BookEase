import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendConfirmationEmail } from "@/lib/email";
import { resolvePriceId } from "@/lib/plans";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook handler — handles two flavours of events:
 *
 *   1. One-time booking payments (checkout.session.completed where
 *      metadata.bookingId is set) — confirms the booking and sends email.
 *
 *   2. Subscription lifecycle for provider plans:
 *      - checkout.session.completed (mode=subscription) — first-time upgrade
 *      - customer.subscription.updated — plan change, renewal, status change
 *      - customer.subscription.deleted — cancellation
 *      - invoice.payment_failed — mark PAST_DUE
 *
 * We never trust client-side state for plan changes; the User row is only
 * mutated from these webhook events (plus customer creation in /billing/checkout).
 */
export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature error:", message);
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Subscription checkout (provider upgrading their plan)
        if (session.mode === "subscription" && session.subscription) {
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          await syncSubscriptionToUser(sub);
          break;
        }

        // One-time booking payment
        const bookingId = session.metadata?.bookingId;
        if (bookingId) {
          const booking = await prisma.booking.update({
            where: { id: bookingId },
            data: { status: "CONFIRMED", paymentStatus: "PAID" },
            include: { service: { include: { provider: true } } },
          });
          try {
            await sendConfirmationEmail(booking);
          } catch (err) {
            console.error("Email error:", err);
          }
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.bookingId;
        if (bookingId) {
          await prisma.booking.update({
            where: { id: bookingId },
            data: { status: "CANCELLED" },
          });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscriptionToUser(sub);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await prisma.user.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            plan: "STARTER",
            planStatus: "CANCELED",
            planInterval: null,
            stripeSubscriptionId: null,
            stripePriceId: null,
            cancelAtPeriodEnd: false,
            currentPeriodEnd: null,
          },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        // Type-narrow: subscription is present on subscription invoices
        const subId =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          typeof (invoice as any).subscription === "string"
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ((invoice as any).subscription as string)
            : null;
        if (subId) {
          await prisma.user.updateMany({
            where: { stripeSubscriptionId: subId },
            data: { planStatus: "PAST_DUE" },
          });
        }
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/**
 * Project a Stripe.Subscription onto our User row.
 *
 * We resolve the active price ID -> our internal plan/interval, then map the
 * Stripe subscription status to our simplified planStatus enum.
 */
async function syncSubscriptionToUser(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const priceId = sub.items.data[0]?.price.id;
  if (!priceId) return;

  const resolved = resolvePriceId(priceId);
  if (!resolved) {
    console.warn("Unknown Stripe price ID, skipping sync:", priceId);
    return;
  }

  const status = mapStripeStatus(sub.status);

  // Stripe subscription periods live on the item in newer API versions; fall
  // back to the deprecated top-level field for older webhook payloads.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const periodEndUnix: number | undefined =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sub as any).current_period_end ?? (sub.items.data[0] as any)?.current_period_end;

  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      plan: resolved.plan,
      planInterval: resolved.interval,
      planStatus: status,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      currentPeriodEnd: periodEndUnix ? new Date(periodEndUnix * 1000) : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      // Once they subscribe, the trial concept no longer applies.
      trialEndsAt: null,
    },
  });
}

function mapStripeStatus(s: Stripe.Subscription.Status): string {
  switch (s) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
    case "unpaid":
      return "CANCELED";
    case "incomplete":
    case "incomplete_expired":
      return "INCOMPLETE";
    default:
      return "ACTIVE";
  }
}
