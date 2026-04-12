import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.formData();
  const token = body.get("token") as string;

  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const booking = await prisma.booking.findFirst({
    where: { id: params.id, cancelToken: token },
  });

  if (!booking) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  if (booking.status === "CANCELLED") {
    return NextResponse.redirect(new URL("/book/cancel?cancelled=already", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }

  const hoursUntil = (new Date(booking.startTime).getTime() - Date.now()) / 3600000;
  if (hoursUntil < 24) {
    return NextResponse.json({ error: "Cannot cancel within 24 hours" }, { status: 400 });
  }

  await prisma.booking.update({
    where: { id: params.id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.redirect(
    new URL(`/book/cancel?cancelled=true&bookingId=${params.id}`, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
  );
}
