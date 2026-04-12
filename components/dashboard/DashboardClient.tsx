"use client";

import { useState } from "react";
import React from "react";
import { format } from "date-fns";
import { Calendar, DollarSign, TrendingDown, CheckCircle, XCircle, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DashboardClient({ upcomingBookings, kpis, services, providerId }: Props) {
  const [bookings, setBookings] = useState(upcomingBookings);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this booking?")) return;
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

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={Calendar} label="Bookings this month" value={kpis.totalBookings} color="indigo" />
        <KPICard icon={DollarSign} label="Revenue this month" value={formatCurrency(kpis.revenue)} color="green" />
        <KPICard icon={CheckCircle} label="Confirmed" value={kpis.confirmedBookings} color="blue" />
        <KPICard icon={TrendingDown} label="Cancellation rate" value={`${kpis.cancellationRate}%`} color="red" />
      </div>

      {/* Upcoming Bookings */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Bookings</h2>
        </div>

        {bookings.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No upcoming bookings</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {bookings.map((booking) => (
              <div key={booking.id} className="px-6 py-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
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
                  <p className="text-sm text-gray-500">{booking.service.name} • {booking.service.duration}min • {formatCurrency(booking.service.price)}</p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    <Clock className="inline h-3 w-3 mr-1" />
                    {format(new Date(booking.startTime), "EEE, MMM d 'at' h:mm a")}
                  </p>
                  {booking.notes && <p className="text-xs text-gray-400 mt-1 italic">&quot;{booking.notes}&quot;</p>}
                </div>
                {booking.status !== "CANCELLED" && (
                  <button
                    onClick={() => handleCancel(booking.id)}
                    disabled={loadingId === booking.id}
                    className="shrink-0 flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Cancel
                  </button>
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
              <div key={s.id} className="border border-gray-100 rounded-lg p-3">
                <p className="font-medium text-gray-900">{s.name}</p>
                <p className="text-sm text-gray-500">{s.duration}min · {formatCurrency(s.price)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
