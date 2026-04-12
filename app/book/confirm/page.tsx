import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { CheckCircle, Calendar, Clock, Mail } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface Props {
  searchParams: { bookingId?: string };
}

export default async function ConfirmPage({ searchParams }: Props) {
  const { bookingId } = searchParams;

  if (!bookingId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">No booking ID provided.</p>
      </div>
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { service: { include: { provider: true } } },
  });

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Booking not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">You&apos;re booked!</h1>
          <p className="text-gray-500 mb-6">
            A confirmation email has been sent to <strong>{booking.clientEmail}</strong>
          </p>

          <div className="bg-gray-50 rounded-xl p-4 text-left space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {format(new Date(booking.startTime), "EEEE, MMMM d, yyyy")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Time</p>
                <p className="text-sm font-medium text-gray-900">
                  {format(new Date(booking.startTime), "h:mm a")} – {format(new Date(booking.endTime), "h:mm a")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">With</p>
                <p className="text-sm font-medium text-gray-900">{booking.service.provider.name}</p>
                <p className="text-xs text-gray-500">{booking.service.name} · {formatCurrency(booking.service.price)}</p>
              </div>
            </div>
          </div>

          {booking.paymentStatus === "UNPAID" && booking.service.price > 0 && (
            <p className="text-sm text-amber-600 bg-amber-50 rounded-lg p-3 mb-4">
              Payment due on site: {formatCurrency(booking.service.price)}
            </p>
          )}

          {booking.service.provider.slug && (
            <Link
              href={`/book/${booking.service.provider.slug}`}
              className="text-sm text-indigo-600 hover:underline"
            >
              Book another appointment
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
