"use client";

import { useState, useMemo } from "react";
import React from "react";
import { format } from "date-fns";
import {
  Calendar, DollarSign, TrendingDown, CheckCircle, XCircle, Clock,
  Search, CalendarClock, Inbox,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { RescheduleModal } from "./RescheduleModal";

interface Booking {
  id: string;
  clientName: string;
  clientEmail: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus: string;
  notes: string | null;
  service: { name: string; duration: number; price: number };
}

interface KPIs {
  totalBookings: number;
  revenue: number;
  cancellationRate: number;
  confirmedBookings: number;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface Props {
  upcomingBookings: Booking[];
  kpis: KPIs;
  services: Service[];
  providerId: string;
}

const statusColors: Record<string, string> = {
  CONFIRMED: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  CANCELLED: "bg-red-100 text-red-700",
  RESCHEDULED: "bg-blue-100 text-blue-700",
};

type FilterStatus = "ALL" | "CONFIRMED" | "PENDING" | "CANCELLED";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DashboardClient({ upcomingBookings, kpis, services, providerId }: Props) {
  const [bookings, setBookings] = useState(upcomingBookings);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [search, setSearch] = useState("");
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (filter !== "ALL" && b.status !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          b.clientName.toLowerCase().includes(q) ||
          b.clientEmail.toLowerCase().includes(q) ||
          b.service.name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [bookings, filter, search]);

  const filterCounts = useMemo(() => ({
    ALL: bookings.length,
    CONFIRMED: bookings.filter((b) => b.status === "CONFIRMED").length,
    PENDING: bookings.filter((b) => b.status === "PENDING").length,
    CANCELLED: bookings.filter((b) => b.status === "CANCELLED").length,
  }), [bookings]);

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this booking? The client will be notified.")) return;
    setLoadingId(id);
    const res = await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    setLoadingId(null);
    if (res.ok) {
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "CANCELLED" } : b))
      );
      toast.success("Booking cancelled");
    } else {
      toast.error("Failed to cancel booking");
    }
  };

  const handleRescheduled = (id: string, newStart: string, newEnd: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, startTime: newStart, endTime: newEnd, status: "RESCHEDULED" } : b
      )
    );
  };

  const filterTabs: { id: FilterStatus; label: string }[] = [
    { id: "ALL", label: "All" },
    { id: "CONFIRMED", label: "Confirmed" },
    { id: "PENDING", label: "Pending" },
    { id: "CANCELLED", label: "Cancelled" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={Calendar} label="Bookings this month" value={kpis.totalBookings} color="indigo" />
        <KPICard icon={DollarSign} label="Revenue this month" value={formatCurrency(kpis.revenue)} color="green" />
        <KPICard icon={CheckCircle} label="Confirmed" value={kpis.confirmedBookings} color="blue" />
        <KPICard icon={TrendingDown} label="Cancellation rate" value={`${kpis.cancellationRate}%`} color="red" />
      </div>

      {/* Bookings Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Bookings</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search bookings…"
                aria-label="Search bookings"
                className="pl-9 pr-3 py-1.5 w-full sm:w-64 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 overflow-x-auto -mx-1 px-1 pb-1">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  filter === tab.id
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  filter === tab.id ? "bg-indigo-100" : "bg-gray-100"
                }`}>
                  {filterCounts[tab.id]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <EmptyBookings hasFilter={filter !== "ALL" || !!search} />
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-gray-50/50 transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900 truncate">{booking.clientName}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
                      {booking.status}
                    </span>
                    {booking.paymentStatus === "PAID" && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        Paid
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {booking.service.name} &middot; {booking.service.duration}min &middot; {formatCurrency(booking.service.price)}
                  </p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    <Clock className="inline h-3 w-3 mr-1" />
                    {format(new Date(booking.startTime), "EEE, MMM d 'at' h:mm a")}
                  </p>
                  {booking.notes && (
                    <p className="text-xs text-gray-400 mt-1 italic">&quot;{booking.notes}&quot;</p>
                  )}
                </div>
                {booking.status !== "CANCELLED" && (
                  <div className="flex flex-col sm:flex-row gap-1.5 shrink-0">
                    <button
                      onClick={() => setRescheduleBooking(booking)}
                      aria-label={`Reschedule booking with ${booking.clientName}`}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition"
                    >
                      <CalendarClock className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Reschedule</span>
                    </button>
                    <button
                      onClick={() => handleCancel(booking.id)}
                      disabled={loadingId === booking.id}
                      aria-label={`Cancel booking with ${booking.clientName}`}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Cancel</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Services Summary */}
      {services.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Services</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {services.map((s) => (
              <div key={s.id} className="border border-gray-100 rounded-lg p-3 hover:border-indigo-200 transition">
                <p className="font-medium text-gray-900">{s.name}</p>
                <p className="text-sm text-gray-500">{s.duration}min &middot; {formatCurrency(s.price)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {rescheduleBooking && (
        <RescheduleModal
          booking={rescheduleBooking}
          providerId={providerId}
          onClose={() => setRescheduleBooking(null)}
          onRescheduled={handleRescheduled}
        />
      )}
    </div>
  );
}

function EmptyBookings({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="py-16 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 mb-3">
        <Inbox className="h-6 w-6 text-gray-400" />
      </div>
      <p className="text-gray-700 font-medium">
        {hasFilter ? "No bookings match your filters" : "No upcoming bookings"}
      </p>
      <p className="text-gray-400 text-sm mt-1">
        {hasFilter ? "Try clearing the filter or search" : "Share your booking link to get started"}
      </p>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string | number; color: string;
}) {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
