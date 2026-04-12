import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCancelToken } from "@/lib/utils";
import { addMinutes } from "date-fns";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const providerId = searchParams.get("providerId") || session.user.id;

  const bookings = await prisma.booking.findMany({
    where: { providerId },
    include: { service: true },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(bookings);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { clientName, clientEmail, serviceId, startTime, notes, payOnSite } = body;

  if (!clientName || !clientEmail || !serviceId || !startTime) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: { provider: true },
  });
  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  const start = new Date(startTime);
  const end = addMinutes(start, service.duration);

  // Check for conflicts
  const conflict = await prisma.booking.findFirst({
    where: {
      providerId: service.providerId,
      status: { not: "CANCELLED" },
      OR: [
        { startTime: { gte: start, lt: end } },
        { endTime: { gt: start, lte: end } },
        { startTime: { lte: start }, endTime: { gte: end } },
      ],
    },
  });
  if (conflict) {
    return NextResponse.json({ error: "This slot is no longer available" }, { status: 409 });
  }

  const cancelToken = generateCancelToken();

  const booking = await prisma.booking.create({
    data: {
      clientName,
      clientEmail,
      serviceId,
      providerId: service.providerId,
      startTime: start,
      endTime: end,
      status: payOnSite ? "CONFIRMED" : "PENDING",
      paymentStatus: payOnSite ? "UNPAID" : "UNPAID",
      notes: notes || null,
      cancelToken,
    },
    include: { service: true },
  });

  return NextResponse.json(booking, { status: 201 });
}
