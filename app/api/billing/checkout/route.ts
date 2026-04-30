import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { PLANS, PlanId, Interval } from "@/lib/plans";

/**
 * Create a Stripe Checkout session for a subscription upgrade.
 *
 * Body: { plan: "PRO" | "BUSINESS", interval: "monthly" | "yearly" }
 *
 * - Reuses the user's existing Stripe customer if present, otherwise creates one
 *   on the fly so the customer object stays in sync with the User row.
 * - The success URL bounces back to /dashboard/billing where the webhook
 *   will already have updated the plan by the time the user lands.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan, interval } = (await req.json()) as { plan: PlanId; interval: Interval };

  if (!plan || !interval) {
    return NextResponse.json({ error: "plan and interval required" }, { status: 400 });
  }
  if (plan === "STARTER") {
    return NextResponse.json({ error: "Cannot subscribe to Starter" }, { status: 400 });
  }

  const def = PLANS[plan];
  if (!def) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });

  const priceId = interval === "monthly" ? def.stripePriceMonthly : def.stripePriceYearly;
  if (!priceId) {
    return NextResponse.json(
      { error: `Stripe price not configured for ${plan} ${interval}` },
      { status: 500 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Make sure the user has a Stripe customer
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { userId: user.id, plan, interval },
    },
    metadata: { userId: user.id, plan, interval, kind: "subscription" },
    success_url: `${appUrl}/dashboard/billing?success=1`,
    cancel_url: `${appUrl}/dashboard/billing?canceled=1`,
  });

  return NextResponse.json({ url: checkout.url });
}
