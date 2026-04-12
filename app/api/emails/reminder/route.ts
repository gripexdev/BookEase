import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminderEmail } from "@/lib/email";
import { addHours } from "date-fns";

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

  const results = await Promise.allSettled(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bookings.map(async (booking: any) => {
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

  return NextResponse.json({ sent, failed, total: bookings.length });
}
