"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import { CreditCard, Sparkles, Clock, AlertTriangle, ExternalLink } from "lucide-react";
import { PLANS, PlanId } from "@/lib/plans";
import { PricingTable } from "@/components/pricing/PricingTable";

interface Props {
  effectivePlan: PlanId;
  planStatus: string;
  planInterval: string | null;
  currentPeriodEnd: string | null;
  trialDaysRemaining: number | null;
  cancelAtPeriodEnd: boolean;
  hasStripeCustomer: boolean;
  usage: { services: number; bookingsThisMonth: number };
}

export function BillingClient({
  effectivePlan,
  planStatus,
  planInterval,
  currentPeriodEnd,
  trialDaysRemaining,
  cancelAtPeriodEnd,
  hasStripeCustomer,
  usage,
}: Props) {
  const [openingPortal, setOpeningPortal] = useState(false);
  const search = useSearchParams();

  // Surface success/cancel state from the Stripe Checkout redirect.
  useEffect(() => {
    if (search.get("success") === "1") {
      toast.success("Subscription updated! It may take a moment to reflect.");
    } else if (search.get("canceled") === "1") {
      toast("Checkout canceled.", { icon: "ℹ️" });
    }
  }, [search]);

  const planDef = PLANS[effectivePlan];
  const limits = planDef.limits;

  const openPortal = async () => {
    setOpeningPortal(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Could not open billing portal");
        setOpeningPortal(false);
      }
    } catch {
      toast.error("Network error");
      setOpeningPortal(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Plan</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your subscription, view usage, and upgrade when you&rsquo;re ready.
        </p>
      </div>

      {/* Trial banner */}
      {planStatus === "TRIALING" && trialDaysRemaining !== null && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-5 flex items-start gap-3 shadow-md">
          <Sparkles className="h-5 w-5 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">
              You&rsquo;re on a Pro free trial &middot; {trialDaysRemaining}{" "}
              {trialDaysRemaining === 1 ? "day" : "days"} left
            </p>
            <p className="text-sm text-indigo-100 mt-1">
              All Pro features are unlocked. Subscribe before your trial ends to keep them.
            </p>
          </div>
        </div>
      )}

      {/* Past due warning */}
      {planStatus === "PAST_DUE" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-amber-900">Payment failed</p>
            <p className="text-sm text-amber-800 mt-1">
              Your most recent invoice couldn&rsquo;t be charged. Update your payment method
              from the billing portal to restore Pro features.
            </p>
          </div>
        </div>
      )}

      {/* Cancellation scheduled */}
      {cancelAtPeriodEnd && currentPeriodEnd && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <Clock className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-amber-900">
              Cancellation scheduled
            </p>
            <p className="text-sm text-amber-800 mt-1">
              Your plan will downgrade to Starter on{" "}
              {format(new Date(currentPeriodEnd), "MMMM d, yyyy")}. You can resume your
              subscription from the billing portal anytime before then.
            </p>
          </div>
        </div>
      )}

      {/* Current plan card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Current plan
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1 flex items-center gap-2">
              {planDef.name}
              {planInterval && effectivePlan !== "STARTER" && (
                <span className="text-sm font-normal text-gray-500 capitalize">
                  &middot; {planInterval}
                </span>
              )}
            </p>
            {currentPeriodEnd && effectivePlan !== "STARTER" && (
              <p className="text-sm text-gray-500 mt-1">
                {cancelAtPeriodEnd ? "Ends" : "Renews"} on{" "}
                {format(new Date(currentPeriodEnd), "MMMM d, yyyy")}
              </p>
            )}
          </div>

          {hasStripeCustomer && (
            <button
              onClick={openPortal}
              disabled={openingPortal}
              className="inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60"
            >
              <CreditCard className="h-4 w-4" />
              {openingPortal ? "Opening…" : "Manage billing"}
              <ExternalLink className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Usage */}
        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <UsageRow
            label="Services"
            used={usage.services}
            cap={limits.maxServices}
          />
          <UsageRow
            label="Bookings this month"
            used={usage.bookingsThisMonth}
            cap={limits.maxBookingsPerMonth}
          />
        </div>
      </div>

      {/* Plans */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {effectivePlan === "BUSINESS" ? "Plans" : "Upgrade your plan"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Cancel or change anytime. All prices in USD.
          </p>
        </div>
        <PricingTable currentPlan={effectivePlan} enableCheckout />
      </div>
    </div>
  );
}

function UsageRow({
  label,
  used,
  cap,
}: {
  label: string;
  used: number;
  cap: number | null;
}) {
  const pct = cap ? Math.min(100, Math.round((used / cap) * 100)) : 0;
  const nearLimit = cap !== null && used / cap >= 0.8;
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex justify-between items-baseline mb-2">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className={`text-sm font-semibold ${nearLimit ? "text-amber-600" : "text-gray-900"}`}>
          {used}
          <span className="text-gray-400 font-normal"> / {cap === null ? "Unlimited" : cap}</span>
        </p>
      </div>
      {cap !== null && (
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${nearLimit ? "bg-amber-500" : "bg-indigo-600"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
