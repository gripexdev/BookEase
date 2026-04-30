import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BillingClient } from "@/components/dashboard/BillingClient";
import { getEffectivePlan, trialDaysRemaining } from "@/lib/subscription";

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      plan: true,
      planStatus: true,
      planInterval: true,
      currentPeriodEnd: true,
      trialEndsAt: true,
      cancelAtPeriodEnd: true,
      stripeCustomerId: true,
    },
  });
  if (!user) return null;

  const effectivePlan = getEffectivePlan(user);
  const trialDays = trialDaysRemaining(user);

  // Quick usage stats so the Starter user knows where they stand
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [serviceCount, monthBookingCount] = await Promise.all([
    prisma.service.count({ where: { providerId: session.user.id } }),
    prisma.booking.count({
      where: {
        providerId: session.user.id,
        createdAt: { gte: startOfMonth },
        status: { not: "CANCELLED" },
      },
    }),
  ]);

  return (
    <BillingClient
      effectivePlan={effectivePlan}
      planStatus={user.planStatus}
      planInterval={user.planInterval}
      currentPeriodEnd={user.currentPeriodEnd ? user.currentPeriodEnd.toISOString() : null}
      trialDaysRemaining={trialDays}
      cancelAtPeriodEnd={user.cancelAtPeriodEnd}
      hasStripeCustomer={!!user.stripeCustomerId}
      usage={{ services: serviceCount, bookingsThisMonth: monthBookingCount }}
    />
  );
}
