import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, bio, serviceType, slug } = await req.json();

  // Check slug uniqueness
  if (slug) {
    const existing = await prisma.user.findFirst({
      where: { slug, NOT: { id: session.user.id } },
    });
    if (existing) {
      return NextResponse.json({ error: "That slug is already taken" }, { status: 400 });
    }
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { name, bio, serviceType, slug: slug || null },
  });

  return NextResponse.json(user);
}
