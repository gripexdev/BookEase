"use client";

import { useState } from "react";
import { format, addDays, isSameDay, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, Check, Loader2, CalendarX } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { formatCurrency, formatTime } from "@/lib/utils";
import { SlotGridSkeleton } from "@/components/ui/Skeleton";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface Provider {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  provider: Provider;
  services: Service[];
  /** Whether the provider's plan allows online payments. When false, paid
   *  services fall through to pay-on-site automatically. */
  paymentsEnabled?: boolean;
}

const STEPS = ["Service", "Date", "Time", "Details", "Confirm"] as const;
type Step = (typeof STEPS)[number];

export function BookingFlow({ provider, services, paymentsEnabled = true }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("Service");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [calendarOffset, setCalendarOffset] = useState(0); // weeks offset
  const [form, setForm] = useState({ name: "", email: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  // If the provider can't accept online payments, force pay-on-site.
  const [payOnSite, setPayOnSite] = useState(!paymentsEnabled);

  const today = startOfDay(new Date());
  const weekStart = addDays(today, calendarOffset * 7);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const selectService = (service: Service) => {
    setSelectedService(service);
    setStep("Date");
  };

  const selectDate = async (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setLoadingSlots(true);
    setStep("Time");

    const res = await fetch(
      `/api/availability?providerId=${provider.id}&date=${format(date, "yyyy-MM-dd")}&serviceId=${selectedService!.id}`
    );
    const data = await res.json();
    setSlots(data.slots || []);
    setLoadingSlots(false);
  };

  const selectTime = (time: string) => {
    setSelectedTime(time);
    setStep("Details");
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;
    if (!form.name || !form.email) return toast.error("Name and email are required");

    setSubmitting(true);
    const startTime = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      ...selectedTime.split(":").map(Number) as [number, number]
    ).toISOString();

    // If paid service, payments are enabled, and user didn't opt for pay-on-site, go to Stripe
    if (selectedService.price > 0 && paymentsEnabled && !payOnSite) {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService.id,
          startTime,
          clientName: form.name,
          clientEmail: form.email,
          notes: form.notes,
        }),
      });
      const data = await res.json();
      setSubmitting(false);
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Failed to start checkout");
      }
      return;
    }

    // Free or pay-on-site: create booking directly
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: selectedService.id,
        startTime,
        clientName: form.name,
        clientEmail: form.email,
        notes: form.notes,
        payOnSite: true,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok) {
      router.push(`/book/confirm?bookingId=${data.id}`);
    } else {
      toast.error(data.error || "Failed to create booking");
    }
  };

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Step indicator */}
      <div className="flex items-center gap-2 justify-center">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition ${
                i < stepIndex
                  ? "bg-indigo-600 text-white"
                  : i === stepIndex
                  ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                  : "bg-gray-200 text-gray-400"
              }`}
            >
              {i < stepIndex ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-6 ${i < stepIndex ? "bg-indigo-600" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Service */}
      {step === "Service" && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose a service</h2>
          <div className="space-y-3">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => selectService(s)}
                className="w-full text-left border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 rounded-xl p-4 transition group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-indigo-700">{s.name}</p>
                    <p className="text-sm text-gray-500">{s.duration} minutes</p>
                  </div>
                  <p className="text-lg font-bold text-indigo-600">{formatCurrency(s.price)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Date */}
      {step === "Date" && (
        <div>
          <button onClick={() => setStep("Service")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pick a date for <span className="text-indigo-600">{selectedService?.name}</span>
          </h2>

          {/* Calendar week navigation */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCalendarOffset((o) => Math.max(0, o - 1))}
                disabled={calendarOffset === 0}
                aria-label="Previous week"
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <p className="text-sm font-medium text-gray-700">
                {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d, yyyy")}
              </p>
              <button
                onClick={() => setCalendarOffset((o) => o + 1)}
                aria-label="Next week"
                className="p-1.5 rounded-lg hover:bg-gray-100 transition"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day) => {
                const isPast = day < today;
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => !isPast && selectDate(day)}
                    disabled={isPast}
                    className={`flex flex-col items-center p-2 rounded-lg text-sm transition ${
                      isPast
                        ? "text-gray-300 cursor-not-allowed"
                        : isSelected
                        ? "bg-indigo-600 text-white"
                        : "hover:bg-indigo-50 hover:text-indigo-700"
                    }`}
                  >
                    <span className="text-xs font-medium">{format(day, "EEE")}</span>
                    <span className="text-base font-semibold mt-0.5">{format(day, "d")}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Time */}
      {step === "Time" && (
        <div>
          <button onClick={() => setStep("Date")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Available times for {selectedDate && format(selectedDate, "EEEE, MMMM d")}
          </h2>
          <p className="text-sm text-gray-500 mb-4">{selectedService?.name} · {selectedService?.duration}min</p>

          {loadingSlots ? (
            <SlotGridSkeleton />
          ) : slots.length === 0 ? (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
                <CalendarX className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-gray-700 font-medium">No available slots on this day</p>
              <button onClick={() => setStep("Date")} className="mt-2 text-sm text-indigo-600 hover:underline">
                Choose another date
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.map((time) => (
                <button
                  key={time}
                  onClick={() => selectTime(time)}
                  className={`py-2.5 px-3 border rounded-lg text-sm font-medium transition ${
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

      {/* Step 4: Details */}
      {step === "Details" && (
        <div>
          <button onClick={() => setStep("Time")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Jane Smith"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="jane@example.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
                placeholder="Any special requests or information…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            {selectedService && selectedService.price > 0 && paymentsEnabled && (
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={payOnSite}
                  onChange={(e) => setPayOnSite(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600"
                />
                Pay on site (skip online payment)
              </label>
            )}
            {selectedService && selectedService.price > 0 && !paymentsEnabled && (
              <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                This provider accepts payment on site only.
              </p>
            )}
          </div>
          <button
            onClick={() => setStep("Confirm")}
            disabled={!form.name || !form.email}
            className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition disabled:opacity-60"
          >
            Review booking
          </button>
        </div>
      )}

      {/* Step 5: Confirm */}
      {step === "Confirm" && selectedService && selectedDate && selectedTime && (
        <div>
          <button onClick={() => setStep("Details")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Confirm your booking</h2>

          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 mb-6">
            <Row label="Service" value={selectedService.name} />
            <Row label="Duration" value={`${selectedService.duration} minutes`} />
            <Row label="Date" value={format(selectedDate, "EEEE, MMMM d, yyyy")} />
            <Row label="Time" value={formatTime(selectedTime)} />
            <Row label="Name" value={form.name} />
            <Row label="Email" value={form.email} />
            {form.notes && <Row label="Notes" value={form.notes} />}
            <div className="border-t border-gray-100 pt-3 flex justify-between">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-indigo-600 text-lg">
                {(payOnSite || !paymentsEnabled)
                  ? `${formatCurrency(selectedService.price)} (pay on site)`
                  : formatCurrency(selectedService.price)}
              </span>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
            ) : selectedService.price > 0 && paymentsEnabled && !payOnSite ? (
              "Pay & Book →"
            ) : (
              "Confirm Booking →"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}
