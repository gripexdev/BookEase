import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const blocked = await prisma.blockedSlot.findFirst({
    where: { id: params.id, providerId: session.user.id },
  });
  if (!blocked) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.blockedSlot.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
