import Link from "next/link";
import { CalendarDays, ArrowRight } from "lucide-react";
import { PricingTable } from "@/components/pricing/PricingTable";

export const metadata = {
  title: "Pricing — BookEase",
  description: "Simple, transparent pricing. Start free, upgrade when you grow.",
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-gray-900">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <CalendarDays className="h-4 w-4 text-white" />
            </div>
            BookEase
          </Link>
          <div className="flex gap-2">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-16 md:py-20">
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Start on a free plan, or try Pro free for 14 days when you sign up.
            No credit card required to start. Cancel anytime.
          </p>
        </div>
      </header>

      {/* Pricing table */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <PricingTable />
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Frequently asked questions</h2>
        <div className="space-y-4">
          {FAQS.map((faq) => (
            <details
              key={faq.q}
              className="group bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-200 transition"
            >
              <summary className="font-semibold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                {faq.q}
                <span className="text-indigo-600 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="text-gray-600 text-sm mt-3 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-600 py-14">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Ready to get started?</h2>
          <p className="text-indigo-100 mb-6">Try Pro free for 14 days — no credit card required.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 font-semibold px-6 py-3 rounded-xl hover:bg-indigo-50 transition shadow-lg"
          >
            Create your free account
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} BookEase</p>
          <div className="flex gap-4">
            <Link href="/pricing" className="hover:text-gray-900 transition">Pricing</Link>
            <Link href="/login" className="hover:text-gray-900 transition">Sign in</Link>
            <Link href="/register" className="hover:text-gray-900 transition">Sign up</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

const FAQS = [
  {
    q: "Can I really start for free?",
    a: "Yes. Starter is free forever and includes one service and up to 20 bookings per month — perfect to test BookEase with real clients. New accounts also get a 14-day free trial of Pro automatically, so you can try every paid feature with no card on file.",
  },
  {
    q: "What happens when my Pro trial ends?",
    a: "If you don't subscribe, your account simply drops back to the Starter plan. Your data, services, and bookings are preserved — only the Pro features become locked.",
  },
  {
    q: "Can I switch plans later?",
    a: "Absolutely. Upgrade, downgrade, or cancel anytime from your billing settings. Stripe handles prorated charges automatically, so you only pay for what you use.",
  },
  {
    q: "Does BookEase take a cut of my bookings?",
    a: "Never. The price you see is the price you pay — we don't take any commission on bookings or payments processed through Stripe. Your clients pay you directly.",
  },
  {
    q: "What payment methods do you accept?",
    a: "All major credit and debit cards via Stripe. Yearly plans get a ~20% discount compared to month-to-month.",
  },
  {
    q: "Do you offer refunds?",
    a: "If you're not happy within the first 14 days of paid service, email us and we'll refund your subscription, no questions asked.",
  },
];
