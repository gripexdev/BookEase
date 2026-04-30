/**
 * Subscription plan definitions for BookEase.
 *
 * The free Starter tier is the acquisition funnel — limited but functional.
 * Pro unlocks payments, reminders, and calendar sync. Business adds team & SMS.
 *
 * Stripe price IDs are pulled from env so we can configure test/live without
 * code changes. If a price ID is missing the corresponding upgrade button is
 * disabled in the UI.
 */

export type PlanId = "STARTER" | "PRO" | "BUSINESS";
export type Interval = "monthly" | "yearly";

export interface PlanLimits {
  /** Max number of services. null = unlimited */
  maxServices: number | null;
  /** Max bookings created per calendar month. null = unlimited */
  maxBookingsPerMonth: number | null;
  /** Max staff/team members (1 = solo). */
  maxTeamMembers: number;
  /** Whether the provider may collect online payments via Stripe Checkout. */
  onlinePayments: boolean;
  /** Whether confirmation + 24h reminder emails are sent. */
  emailReminders: boolean;
  /** Whether the provider can sync to Google Calendar. */
  calendarSync: boolean;
  /** Whether SMS reminders are available (Business only). */
  smsReminders: boolean;
  /** Whether the public booking page hides "Powered by BookEase". */
  customBranding: boolean;
  /** Whether the provider can connect a custom domain. */
  customDomain: boolean;
  /** Whether advanced analytics / exports are unlocked. */
  advancedAnalytics: boolean;
  /** Cancellation policy & deposits. */
  cancellationPolicy: boolean;
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  tagline: string;
  /** Display price for monthly ($USD). */
  monthlyPrice: number;
  /** Display price for yearly ($USD, full year). */
  yearlyPrice: number;
  /** Stripe price IDs (env-driven). */
  stripePriceMonthly: string | null;
  stripePriceYearly: string | null;
  /** Marketing bullet list. */
  features: string[];
  /** Hard limits & feature flags consumed by paywall checks. */
  limits: PlanLimits;
  /** Mark for "most popular" highlight on pricing page. */
  highlighted?: boolean;
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  STARTER: {
    id: "STARTER",
    name: "Starter",
    tagline: "Perfect for trying out BookEase",
    monthlyPrice: 0,
    yearlyPrice: 0,
    stripePriceMonthly: null,
    stripePriceYearly: null,
    features: [
      "1 service",
      "Up to 20 bookings per month",
      "Public booking page",
      'Branded "Powered by BookEase" footer',
      "Pay-on-site bookings only",
      "Email confirmations",
    ],
    limits: {
      maxServices: 1,
      maxBookingsPerMonth: 20,
      maxTeamMembers: 1,
      onlinePayments: false,
      emailReminders: false,
      calendarSync: false,
      smsReminders: false,
      customBranding: false,
      customDomain: false,
      advancedAnalytics: false,
      cancellationPolicy: false,
    },
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    tagline: "Everything serious solo providers need",
    monthlyPrice: 19,
    yearlyPrice: 182, // ~20% off
    stripePriceMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY || null,
    stripePriceYearly: process.env.STRIPE_PRICE_PRO_YEARLY || null,
    features: [
      "Unlimited services",
      "Unlimited bookings",
      "Online payments (Stripe)",
      "Auto email reminders (24h before)",
      "Google Calendar sync",
      "Cancellation policy & deposits",
      "Custom branding (no BookEase footer)",
      "Priority email support",
    ],
    limits: {
      maxServices: null,
      maxBookingsPerMonth: null,
      maxTeamMembers: 1,
      onlinePayments: true,
      emailReminders: true,
      calendarSync: true,
      smsReminders: false,
      customBranding: true,
      customDomain: false,
      advancedAnalytics: true,
      cancellationPolicy: true,
    },
    highlighted: true,
  },
  BUSINESS: {
    id: "BUSINESS",
    name: "Business",
    tagline: "For teams and growing businesses",
    monthlyPrice: 49,
    yearlyPrice: 470,
    stripePriceMonthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY || null,
    stripePriceYearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY || null,
    features: [
      "Everything in Pro",
      "Up to 5 team members",
      "SMS reminders",
      "Custom domain (booking.yourbiz.com)",
      "Advanced analytics & exports",
      "Webhook integrations",
      "Priority email + chat support",
    ],
    limits: {
      maxServices: null,
      maxBookingsPerMonth: null,
      maxTeamMembers: 5,
      onlinePayments: true,
      emailReminders: true,
      calendarSync: true,
      smsReminders: true,
      customBranding: true,
      customDomain: true,
      advancedAnalytics: true,
      cancellationPolicy: true,
    },
  },
};

export const PLAN_ORDER: PlanId[] = ["STARTER", "PRO", "BUSINESS"];

/**
 * Resolve a Stripe price ID -> plan/interval. Used when handling webhooks.
 */
export function resolvePriceId(priceId: string): { plan: PlanId; interval: Interval } | null {
  for (const plan of PLAN_ORDER) {
    const def = PLANS[plan];
    if (def.stripePriceMonthly === priceId) return { plan, interval: "monthly" };
    if (def.stripePriceYearly === priceId) return { plan, interval: "yearly" };
  }
  return null;
}

/**
 * Pretty label for a plan + interval combo.
 */
export function planLabel(plan: PlanId, interval?: string | null): string {
  const def = PLANS[plan];
  if (plan === "STARTER") return def.name;
  return interval ? `${def.name} (${interval})` : def.name;
}
