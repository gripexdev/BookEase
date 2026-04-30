/**
 * Subscription helper utilities.
 *
 * Centralises plan resolution and limit checks so paywalls behave consistently
 * everywhere (API routes, server components, client UI via fetched data).
 *
 * Design notes:
 * - We store the *intended* plan on the User row but always pass it through
 *   getEffectivePlan() before enforcing limits. That way an expired trial
 *   transparently downgrades to Starter without a separate cron job.
 * - Limit checks are async because monthly-booking checks need a DB query.
 */

import { prisma } from "@/lib/prisma";
import { PLANS, PlanId, PlanLimits } from "@/lib/plans";

export interface SubscriptionStateInput {
  plan: string;
  planStatus: string;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
}

/**
 * Returns the plan the user should *actually* be treated as right now.
 *
 * Rules:
 * - TRIALING + trialEndsAt in the future  -> intended plan
 * - TRIALING + trialEndsAt passed         -> STARTER (trial expired)
 * - ACTIVE                                -> intended plan
 * - PAST_DUE / INCOMPLETE                 -> STARTER (grace handling could go here later)
 * - CANCELED + currentPeriodEnd in future -> intended plan (paid through period)
 * - CANCELED + currentPeriodEnd passed    -> STARTER
 */
export function getEffectivePlan(u: SubscriptionStateInput): PlanId {
  const intended = (u.plan as PlanId) || "STARTER";
  const now = new Date();

  if (intended === "STARTER") return "STARTER";

  switch (u.planStatus) {
    case "TRIALING":
      if (u.trialEndsAt && u.trialEndsAt.getTime() > now.getTime()) return intended;
      return "STARTER";
    case "ACTIVE":
      return intended;
    case "CANCELED":
      if (u.currentPeriodEnd && u.currentPeriodEnd.getTime() > now.getTime()) return intended;
      return "STARTER";
    case "PAST_DUE":
    case "INCOMPLETE":
    default:
      return "STARTER";
  }
}

export function getLimits(u: SubscriptionStateInput): PlanLimits {
  return PLANS[getEffectivePlan(u)].limits;
}

/**
 * Check whether the user has reached their per-month booking creation cap.
 * Bookings are counted by `createdAt` within the current calendar month.
 */
export async function isBookingLimitReached(
  providerId: string,
  state: SubscriptionStateInput
): Promise<boolean> {
  const limits = getLimits(state);
  if (limits.maxBookingsPerMonth === null) return false;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const count = await prisma.booking.count({
    where: {
      providerId,
      createdAt: { gte: startOfMonth },
      status: { not: "CANCELLED" },
    },
  });

  return count >= limits.maxBookingsPerMonth;
}

/**
 * Check whether the user has reached their service count cap.
 */
export async function isServiceLimitReached(
  providerId: string,
  state: SubscriptionStateInput
): Promise<boolean> {
  const limits = getLimits(state);
  if (limits.maxServices === null) return false;

  const count = await prisma.service.count({ where: { providerId } });
  return count >= limits.maxServices;
}

/**
 * Convenience: load subscription state from a user id.
 */
export async function loadSubscriptionState(userId: string): Promise<SubscriptionStateInput | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      planStatus: true,
      trialEndsAt: true,
      currentPeriodEnd: true,
    },
  });
  return user;
}

/**
 * Days remaining in trial (or null if not on a trial).
 */
export function trialDaysRemaining(state: SubscriptionStateInput): number | null {
  if (state.planStatus !== "TRIALING" || !state.trialEndsAt) return null;
  const ms = state.trialEndsAt.getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
