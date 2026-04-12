import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addMinutes } from "date-fns";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const body = await req.json();
  const { status, startTime, cancelToken } = body;

  // Allow cancel via token (public, no auth needed)
  if (cancelToken) {
    const booking = await prisma.booking.findFirst({
      where: { id: params.id, cancelToken },
      include: { service: true },
    });
    if (!booking) return NextResponse.json({ error: "Invalid cancel token" }, { status: 403 });

    // Check cancellation window (24 hours)
    const hoursUntil = (new Date(booking.startTime).getTime() - Date.now()) / 3600000;
    if (hoursUntil < 24) {
      return NextResponse.json({ error: "Cannot cancel within 24 hours of appointment" }, { status: 400 });
    }

    const updated = await prisma.booking.update({
      where: { id: params.id },
      data: { status: "CANCELLED" },
    });
    return NextResponse.json(updated);
  }

  // Authenticated provider actions
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const booking = await prisma.booking.findFirst({
    where: { id: params.id, providerId: session.user.id },
    include: { service: true },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {};
  if (status) updateData.status = status;
  if (startTime) {
    updateData.startTime = new Date(startTime);
    updateData.endTime = addMinutes(new Date(startTime), booking.service.duration);
    updateData.status = "RESCHEDULED";
  }

  const updated = await prisma.booking.update({
    where: { id: params.id },
    data: updateData,
  });
  return NextResponse.json(updated);
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { service: { include: { provider: true } } },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(booking);
}
