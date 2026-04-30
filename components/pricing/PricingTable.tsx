"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { PLANS, PLAN_ORDER, Interval } from "@/lib/plans";

interface Props {
  /** Optional: which plan the current user is on (for "Current plan" badge). */
  currentPlan?: string;
  /** When provided, render upgrade buttons that POST to /api/billing/checkout instead of linking to /register. */
  enableCheckout?: boolean;
}

/**
 * Pricing table used on both the public /pricing page and the in-app
 * /dashboard/billing page. The two contexts only differ by what the CTA does.
 */
export function PricingTable({ currentPlan, enableCheckout }: Props) {
  const [interval, setInterval] = useState<Interval>("monthly");
  const [loading, setLoading] = useState<string | null>(null);

  const startCheckout = async (planId: "PRO" | "BUSINESS") => {
    setLoading(planId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, interval }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to start checkout");
        setLoading(null);
      }
    } catch (e) {
      console.error(e);
      setLoading(null);
    }
  };

  return (
    <div>
      {/* Billing interval toggle */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex bg-gray-100 rounded-full p-1">
          <button
            onClick={() => setInterval("monthly")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition ${
              interval === "monthly" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval("yearly")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition flex items-center gap-1.5 ${
              interval === "yearly" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Yearly
            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {PLAN_ORDER.map((id) => {
          const plan = PLANS[id];
          const isCurrent = currentPlan === id;
          const price =
            interval === "monthly" ? plan.monthlyPrice : Math.round(plan.yearlyPrice / 12);
          const totalYearly = plan.yearlyPrice;

          return (
            <div
              key={id}
              className={`relative rounded-2xl border-2 p-6 flex flex-col transition ${
                plan.highlighted
                  ? "border-indigo-500 bg-gradient-to-b from-indigo-50/50 to-white shadow-lg"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Most popular
                </div>
              )}
              {isCurrent && (
                <div className="absolute top-4 right-4 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                  Current
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plan.tagline}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">${price}</span>
                  <span className="text-gray-500 text-sm">/mo</span>
                </div>
                {id !== "STARTER" && interval === "yearly" && (
                  <p className="text-xs text-gray-500 mt-1">
                    Billed ${totalYearly} yearly
                  </p>
                )}
                {id !== "STARTER" && interval === "monthly" && (
                  <p className="text-xs text-gray-400 mt-1">Billed monthly</p>
                )}
                {id === "STARTER" && (
                  <p className="text-xs text-gray-400 mt-1">Free forever</p>
                )}
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {id === "STARTER" ? (
                enableCheckout ? (
                  <button
                    disabled
                    className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold bg-gray-100 text-gray-500 cursor-not-allowed"
                  >
                    {isCurrent ? "Current plan" : "Free plan"}
                  </button>
                ) : (
                  <Link
                    href="/register"
                    className="block text-center w-full py-2.5 px-4 rounded-lg text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                  >
                    Start free
                  </Link>
                )
              ) : enableCheckout ? (
                <button
                  onClick={() => startCheckout(id as "PRO" | "BUSINESS")}
                  disabled={loading === id || isCurrent}
                  className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition disabled:opacity-60 ${
                    plan.highlighted
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow"
                      : "bg-gray-900 hover:bg-black text-white"
                  }`}
                >
                  {loading === id
                    ? "Loading…"
                    : isCurrent
                    ? "Current plan"
                    : `Upgrade to ${plan.name}`}
                </button>
              ) : (
                <Link
                  href="/register"
                  className={`block text-center w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition ${
                    plan.highlighted
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow"
                      : "bg-gray-900 hover:bg-black text-white"
                  }`}
                >
                  Start 14-day free trial
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
