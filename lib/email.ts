import { Resend } from "resend";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "noreply@bookease.app";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface BookingWithRelations {
  id: string;
  clientName: string;
  clientEmail: string;
  startTime: Date | string;
  endTime: Date | string;
  notes: string | null;
  cancelToken: string | null;
  service: {
    name: string;
    duration: number;
    price: number;
    provider: {
      name: string | null;
      email: string;
      slug: string | null;
    };
  };
}

function bookingEmailHtml(booking: BookingWithRelations, isReminder = false) {
  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);
  const dateStr = format(start, "EEEE, MMMM d, yyyy");
  const timeStr = `${format(start, "h:mm a")} – ${format(end, "h:mm a")}`;
  const cancelUrl = `${APP_URL}/book/cancel?bookingId=${booking.id}&token=${booking.cancelToken}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; background: #f9fafb; }
    .container { max-width: 560px; margin: 40px auto; background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; }
    .header { background: #4f46e5; padding: 28px 32px; color: white; }
    .header h1 { margin: 0; font-size: 20px; }
    .header p { margin: 6px 0 0; opacity: 0.85; font-size: 14px; }
    .body { padding: 32px; }
    .detail-row { display: flex; gap: 8px; margin-bottom: 12px; }
    .label { color: #6b7280; font-size: 13px; width: 80px; flex-shrink: 0; padding-top: 2px; }
    .value { color: #111827; font-size: 14px; font-weight: 500; }
    .card { background: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .cancel-link { display: block; margin-top: 24px; text-align: center; font-size: 12px; color: #9ca3af; }
    .cancel-link a { color: #6b7280; }
    .footer { padding: 20px 32px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${isReminder ? "⏰ Reminder: Appointment Tomorrow" : "✅ Booking Confirmed!"}</h1>
      <p>${isReminder ? `Don't forget your appointment tomorrow` : `Hi ${booking.clientName}, you're all set!`}</p>
    </div>
    <div class="body">
      <div class="card">
        <div class="detail-row"><span class="label">Service</span><span class="value">${booking.service.name}</span></div>
        <div class="detail-row"><span class="label">Provider</span><span class="value">${booking.service.provider.name}</span></div>
        <div class="detail-row"><span class="label">Date</span><span class="value">${dateStr}</span></div>
        <div class="detail-row"><span class="label">Time</span><span class="value">${timeStr}</span></div>
        <div class="detail-row"><span class="label">Duration</span><span class="value">${booking.service.duration} minutes</span></div>
        <div class="detail-row"><span class="label">Price</span><span class="value">${formatCurrency(booking.service.price)}</span></div>
        ${booking.notes ? `<div class="detail-row"><span class="label">Notes</span><span class="value">${booking.notes}</span></div>` : ""}
      </div>
      ${booking.cancelToken ? `<div class="cancel-link">Need to cancel? <a href="${cancelUrl}">Click here to cancel</a> (must be 24+ hours before)</div>` : ""}
    </div>
    <div class="footer">Powered by BookEase &middot; <a href="${APP_URL}" style="color: #9ca3af;">bookease.app</a></div>
  </div>
</body>
</html>`;
}

export async function sendConfirmationEmail(booking: BookingWithRelations) {
  const start = new Date(booking.startTime);
  const dateStr = format(start, "MMM d 'at' h:mm a");

  await resend.emails.send({
    from: FROM,
    to: booking.clientEmail,
    subject: `Booking confirmed: ${booking.service.name} on ${dateStr}`,
    html: bookingEmailHtml(booking, false),
  });
}

export async function sendReminderEmail(booking: BookingWithRelations) {
  const start = new Date(booking.startTime);
  const timeStr = format(start, "h:mm a");

  await resend.emails.send({
    from: FROM,
    to: booking.clientEmail,
    subject: `Reminder: ${booking.service.name} tomorrow at ${timeStr}`,
    html: bookingEmailHtml(booking, true),
  });
}
