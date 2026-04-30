import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isServiceLimitReached, loadSubscriptionState, getEffectivePlan } from "@/lib/subscription";
import { PLANS } from "@/lib/plans";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const providerId = searchParams.get("providerId");
  if (!providerId) return NextResponse.json({ error: "providerId required" }, { status: 400 });

  const services = await prisma.service.findMany({ where: { providerId }, orderBy: { createdAt: "asc" } });
  return NextResponse.json(services);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, duration, price } = await req.json();
  if (!name || !duration || price === undefined) {
    return NextResponse.json({ error: "name, duration, price required" }, { status: 400 });
  }

  // Plan enforcement: Starter is capped at 1 service.
  const state = await loadSubscriptionState(session.user.id);
  if (state) {
    const reached = await isServiceLimitReached(session.user.id, state);
    if (reached) {
      const plan = getEffectivePlan(state);
      const cap = PLANS[plan].limits.maxServices;
      return NextResponse.json(
        {
          error: `You've reached the ${cap}-service limit on the ${PLANS[plan].name} plan. Upgrade to add more.`,
          code: "PLAN_LIMIT",
        },
        { status: 402 }
      );
    }
  }

  const service = await prisma.service.create({
    data: { name, duration: Number(duration), price: Number(price), providerId: session.user.id },
  });
  return NextResponse.json(service, { status: 201 });
}
