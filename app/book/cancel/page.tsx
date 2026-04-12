import { prisma } from "@/lib/prisma";

import Link from "next/link";
import { XCircle, CheckCircle } from "lucide-react";

interface Props {
  searchParams: { bookingId?: string; token?: string };
}

export default async function CancelPage({ searchParams }: Props) {
  const { bookingId, token } = searchParams;

  if (!bookingId || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-500">Invalid cancellation link.</p>
        </div>
      </div>
    );
  }

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, cancelToken: token },
    include: { service: true },
  });

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-500">Booking not found or already cancelled.</p>
        </div>
      </div>
    );
  }

  if (booking.status === "CANCELLED") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center max-w-sm">
          <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Already cancelled</h2>
          <p className="text-sm text-gray-500">This booking has already been cancelled.</p>
        </div>
      </div>
    );
  }

  // Check the 24-hour window
  const hoursUntil = (new Date(booking.startTime).getTime() - Date.now()) / 3600000;
  const canCancel = hoursUntil >= 24;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center max-w-sm w-full">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Cancel Booking</h1>
        <p className="text-sm text-gray-500 mb-6">
          {booking.service.name} on{" "}
          {new Date(booking.startTime).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>

        {canCancel ? (
          <form action={`/api/bookings/${bookingId}/cancel`} method="POST">
            <input type="hidden" name="token" value={token} />
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition"
            >
              Yes, cancel this booking
            </button>
            <Link href="/" className="block mt-3 text-sm text-gray-500 hover:underline">
              Keep my booking
            </Link>
          </form>
        ) : (
          <div className="text-center">
            <XCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-red-600 font-medium">Cannot cancel within 24 hours</p>
            <p className="text-xs text-gray-400 mt-1">
              Please contact the provider directly to reschedule.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
