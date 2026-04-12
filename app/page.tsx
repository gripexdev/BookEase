import Link from "next/link";
import { CalendarDays, Clock, CreditCard, Mail, BarChart3, Users } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <header className="bg-indigo-600 text-white">
        <nav className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl">
            <CalendarDays className="h-6 w-6" /> BookEase
          </div>
          <div className="flex gap-3">
            <Link href="/login" className="px-4 py-2 text-sm rounded-lg border border-white/30 hover:bg-white/10 transition">
              Sign in
            </Link>
            <Link href="/register" className="px-4 py-2 text-sm rounded-lg bg-white text-indigo-600 font-medium hover:bg-indigo-50 transition">
              Get started
            </Link>
          </div>
        </nav>
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Scheduling Made Simple</h1>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Let your clients book appointments online. Manage your calendar, accept payments, and send automatic reminders.
          </p>
          <Link href="/register" className="inline-block bg-white text-indigo-600 font-semibold px-8 py-3 rounded-xl hover:bg-indigo-50 transition text-lg">
            Start for free &rarr;
          </Link>
        </div>
      </header>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Everything you need</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: CalendarDays, title: "Smart Scheduling", desc: "Set your availability, block off time, and let clients book 24/7." },
            { icon: CreditCard, title: "Stripe Payments", desc: "Collect booking fees upfront with secure Stripe Checkout." },
            { icon: Mail, title: "Auto Reminders", desc: "Automated confirmation and 24-hour reminder emails via Resend." },
            { icon: Clock, title: "Multiple Services", desc: "Define services with custom durations (30/60/90 min) and pricing." },
            { icon: BarChart3, title: "Dashboard KPIs", desc: "Track bookings, revenue, and cancellation rates at a glance." },
            { icon: Users, title: "Public Booking Page", desc: "Share your booking link — clients book without signing up." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-gray-50 rounded-xl p-6">
              <div className="bg-indigo-100 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                <Icon className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-600 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-50 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to streamline your bookings?</h2>
        <Link href="/register" className="inline-block bg-indigo-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-indigo-700 transition">
          Create your free account
        </Link>
      </section>

      <footer className="border-t border-gray-100 py-8 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} BookEase. Built with Next.js, Prisma, Stripe &amp; Resend.
      </footer>
    </main>
  );
}
