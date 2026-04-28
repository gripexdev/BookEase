import Link from "next/link";
import {
  CalendarDays, Clock, CreditCard, Mail, BarChart3, Users,
  Check, ArrowRight, Sparkles, Shield, Zap,
} from "lucide-react";

export default function HomePage() {
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
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition">
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
      <header className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/50 via-transparent to-transparent"></div>
        <div className="relative max-w-5xl mx-auto px-4 py-20 md:py-28 text-center animate-fade-in">
          <span className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-medium mb-6">
            <Sparkles className="h-3 w-3" />
            Now with Stripe payments &amp; auto reminders
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 tracking-tight mb-6">
            Scheduling made
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> beautifully simple</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Let your clients book appointments online — manage your calendar, accept payments,
            and send automatic reminders, all from one polished dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition shadow-md hover:shadow-lg"
            >
              Start free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/book/alex-thompson"
              className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-900 font-semibold px-6 py-3 rounded-xl transition"
            >
              View demo booking page
            </Link>
          </div>

          {/* Stat strip */}
          <div className="grid grid-cols-3 gap-4 mt-16 max-w-2xl mx-auto">
            {[
              { value: "30s", label: "Setup time" },
              { value: "24/7", label: "Online booking" },
              { value: "0%", label: "Booking commission" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs md:text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Everything you need
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            From booking to payment to reminders, BookEase handles the entire client journey for you.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: CalendarDays, title: "Smart Scheduling", desc: "Set your availability, block off vacations, and let clients book 24/7." },
            { icon: CreditCard, title: "Stripe Payments", desc: "Collect booking fees upfront with secure Stripe Checkout." },
            { icon: Mail, title: "Auto Reminders", desc: "Confirmation and 24-hour reminder emails sent on autopilot via Resend." },
            { icon: Clock, title: "Multiple Services", desc: "Define services with custom durations (30/60/90 min) and pricing." },
            { icon: BarChart3, title: "Dashboard KPIs", desc: "Track bookings, revenue, and cancellation rates at a glance." },
            { icon: Users, title: "Public Booking Page", desc: "Share your booking link — clients book without signing up." },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group bg-white border border-gray-100 rounded-2xl p-6 hover:border-indigo-200 hover:shadow-lg transition"
            >
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-11 h-11 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              How it works
            </h2>
            <p className="text-gray-600">From signup to first booking in under a minute.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: "01", title: "Set up your services", desc: "Define your services with duration and price, then set your weekly availability." },
              { num: "02", title: "Share your booking link", desc: "Send your unique booking URL — bookease.app/book/your-name — to clients." },
              { num: "03", title: "Get paid &amp; show up", desc: "Clients pay via Stripe and you both receive instant confirmation. Reminders sent automatically." },
            ].map((step) => (
              <div key={step.num} className="relative">
                <span className="text-6xl font-bold bg-gradient-to-br from-indigo-200 to-purple-200 bg-clip-text text-transparent">
                  {step.num}
                </span>
                <h3 className="font-semibold text-gray-900 mt-2 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: step.desc }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: "Secure by default", desc: "Stripe-grade payment security and NextAuth-protected admin." },
            { icon: Zap, title: "Lightning fast", desc: "Built on Next.js 14 with server components and edge-ready routes." },
            { icon: Check, title: "Built for real use", desc: "Conflict detection, cancellation windows, and Google Calendar sync." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Icon className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-gray-600 text-sm">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-600 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to streamline your bookings?
          </h2>
          <p className="text-indigo-100 mb-8 text-lg">
            Free for life. No credit card required.
          </p>
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
          <p>&copy; {new Date().getFullYear()} BookEase. Built with Next.js, Prisma, Stripe &amp; Resend.</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-gray-900 transition">Sign in</Link>
            <Link href="/register" className="hover:text-gray-900 transition">Sign up</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
