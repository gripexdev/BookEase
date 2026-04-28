import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const blocked = await prisma.blockedSlot.findMany({
    where: { providerId: session.user.id },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(blocked);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date, startTime, endTime, reason } = await req.json();
  if (!date) return NextResponse.json({ error: "Date required" }, { status: 400 });

  const blocked = await prisma.blockedSlot.create({
    data: {
      providerId: session.user.id,
      date: new Date(date),
      startTime: startTime || null,
      endTime: endTime || null,
      reason: reason || null,
    },
  });
  return NextResponse.json(blocked, { status: 201 });
}
