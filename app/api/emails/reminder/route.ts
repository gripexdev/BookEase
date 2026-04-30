import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminderEmail } from "@/lib/email";
import { addHours } from "date-fns";
import { getLimits } from "@/lib/subscription";

// This endpoint is meant to be called by a cron job every hour (or daily at a set time)
// Protect it with a secret header
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET || "cron-secret";

  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in24h = addHours(now, 24);
  const in25h = addHours(now, 25);

  // Find bookings 24-25 hours from now that haven't had a reminder sent
  const bookings = await prisma.booking.findMany({
    where: {
      startTime: { gte: in24h, lt: in25h },
      status: "CONFIRMED",
      reminderSent: false,
    },
    include: { service: { include: { provider: true } } },
  });

  // Only send reminders for providers whose plan includes them.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eligible = (bookings as any[]).filter((b) => {
    const p = b.service.provider;
    return getLimits({
      plan: p.plan,
      planStatus: p.planStatus,
      trialEndsAt: p.trialEndsAt,
      currentPeriodEnd: p.currentPeriodEnd,
    }).emailReminders;
  });

  const results = await Promise.allSettled(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eligible.map(async (booking: any) => {
      await sendReminderEmail(booking);
      await prisma.booking.update({
        where: { id: booking.id },
        data: { reminderSent: true },
      });
      return booking.id;
    })
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;
  const skipped = bookings.length - eligible.length;

  return NextResponse.json({ sent, failed, skipped, total: bookings.length });
}
