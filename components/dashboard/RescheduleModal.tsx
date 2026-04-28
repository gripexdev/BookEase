"use client";

import { useEffect, useState } from "react";
import { format, addDays, startOfDay } from "date-fns";
import { X, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { formatTime } from "@/lib/utils";

interface Booking {
  id: string;
  clientName: string;
  startTime: string;
  service: { name: string; duration: number };
}

interface Props {
  booking: Booking;
  providerId: string;
  onClose: () => void;
  onRescheduled: (id: string, newStart: string, newEnd: string) => void;
}

export function RescheduleModal({ booking, providerId, onClose, onRescheduled }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [calendarOffset, setCalendarOffset] = useState(0);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const today = startOfDay(new Date());
  const weekStart = addDays(today, calendarOffset * 7);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const loadSlots = async (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setLoadingSlots(true);

    // We need a serviceId; fetch via providerId/date with the booking's service inferred
    // Instead, we fetch availability using the existing service endpoint
    const serviceId = await getServiceIdForBooking();
    const res = await fetch(
      `/api/availability?providerId=${providerId}&date=${format(date, "yyyy-MM-dd")}&serviceId=${serviceId}`
    );
    const data = await res.json();
    setSlots(data.slots || []);
    setLoadingSlots(false);
  };

  // Helper: fetch services and pick the one matching the booking's service name
  const getServiceIdForBooking = async (): Promise<string> => {
    const res = await fetch(`/api/services?providerId=${providerId}`);
    const services = await res.json();
    const match = services.find(
      (s: { name: string; duration: number }) =>
        s.name === booking.service.name && s.duration === booking.service.duration
    );
    return match?.id || services[0]?.id;
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) return;
    setSubmitting(true);
    const [h, m] = selectedTime.split(":").map(Number);
    const newStart = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      h,
      m
    );

    const res = await fetch(`/api/bookings/${booking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startTime: newStart.toISOString() }),
    });
    setSubmitting(false);

    if (res.ok) {
      const updated = await res.json();
      toast.success("Booking rescheduled");
      onRescheduled(booking.id, updated.startTime, updated.endTime);
      onClose();
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to reschedule");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reschedule-title"
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 id="reschedule-title" className="text-lg font-semibold text-gray-900">
              Reschedule booking
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {booking.clientName} &middot; {booking.service.name}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Currently: {format(new Date(booking.startTime), "EEE, MMM d 'at' h:mm a")}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Calendar week navigation */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setCalendarOffset((o) => Math.max(0, o - 1))}
                disabled={calendarOffset === 0}
                aria-label="Previous week"
                className="p-1 rounded-lg hover:bg-white disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className="text-sm font-medium text-gray-700">
                {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d")}
              </p>
              <button
                onClick={() => setCalendarOffset((o) => o + 1)}
                aria-label="Next week"
                className="p-1 rounded-lg hover:bg-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day) => {
                const isPast = day < today;
                const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => !isPast && loadSlots(day)}
                    disabled={isPast}
                    aria-label={format(day, "EEEE, MMMM d")}
                    aria-pressed={!!isSelected}
                    className={`flex flex-col items-center p-2 rounded-lg text-sm transition ${
                      isPast
                        ? "text-gray-300 cursor-not-allowed"
                        : isSelected
                        ? "bg-indigo-600 text-white"
                        : "hover:bg-white hover:text-indigo-700"
                    }`}
                  >
                    <span className="text-[10px] font-medium">{format(day, "EEE")}</span>
                    <span className="text-sm font-semibold mt-0.5">{format(day, "d")}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slots */}
          {selectedDate && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Available times on {format(selectedDate, "EEEE, MMM d")}
              </p>
              {loadingSlots ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                </div>
              ) : slots.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No available slots</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`py-2 px-2 border rounded-lg text-sm font-medium transition ${
                        selectedTime === time
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-white border-gray-200 text-gray-800 hover:border-indigo-500 hover:text-indigo-700 hover:bg-indigo-50/40"
                      }`}
                    >
                      {formatTime(time)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedTime || submitting}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Reschedule
          </button>
        </div>
      </div>
    </div>
  );
}
