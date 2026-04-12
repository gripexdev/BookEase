import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTimeSlots } from "@/lib/utils";
import { addMinutes, parseISO, startOfDay } from "date-fns";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const providerId = searchParams.get("providerId");
  const dateStr = searchParams.get("date");
  const serviceId = searchParams.get("serviceId");

  if (!providerId || !dateStr || !serviceId) {
    return NextResponse.json({ error: "providerId, date, serviceId required" }, { status: 400 });
  }

  const date = parseISO(dateStr);
  const dayOfWeek = date.getDay();

  const [availability, service, blockedSlots, existingBookings] = await Promise.all([
    prisma.availability.findFirst({ where: { providerId, dayOfWeek } }),
    prisma.service.findUnique({ where: { id: serviceId } }),
    prisma.blockedSlot.findMany({
      where: { providerId, date: { gte: startOfDay(date), lt: new Date(date.getTime() + 86400000) } },
    }),
    prisma.booking.findMany({
      where: {
        providerId,
        status: { not: "CANCELLED" },
        startTime: { gte: startOfDay(date), lt: new Date(date.getTime() + 86400000) },
      },
    }),
  ]);

  if (!availability || !service) {
    return NextResponse.json({ slots: [] });
  }

  const allSlots = generateTimeSlots(availability.startTime, availability.endTime, service.duration);

  // Filter out blocked and booked slots
  const availableSlots = allSlots.filter((slotTime) => {
    const [h, m] = slotTime.split(":").map(Number);
    const slotStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m);
    const slotEnd = addMinutes(slotStart, service.duration);

    // Check blocked slots
    for (const blocked of blockedSlots) {
      if (!blocked.startTime) return false; // all-day block
      const [bh, bm] = blocked.startTime.split(":").map(Number);
      const blockStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), bh, bm);
      if (blocked.endTime) {
        const [eh, em] = blocked.endTime.split(":").map(Number);
        const blockEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), eh, em);
        if (slotStart < blockEnd && slotEnd > blockStart) return false;
      }
    }

    // Check existing bookings
    for (const booking of existingBookings) {
      const bookStart = new Date(booking.startTime);
      const bookEnd = new Date(booking.endTime);
      if (slotStart < bookEnd && slotEnd > bookStart) return false;
    }

    // Don't show past slots
    if (slotStart <= new Date()) return false;

    return true;
  });

  return NextResponse.json({ slots: availableSlots });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { availability } = await req.json();

  // Replace all availability for this provider
  await prisma.availability.deleteMany({ where: { providerId: session.user.id } });

  if (availability.length > 0) {
    await prisma.availability.createMany({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: availability.map((a: any) => ({
        providerId: session.user.id,
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
      })),
    });
  }

  return NextResponse.json({ success: true });
}
