import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthUrl } from "@/lib/googleCalendar";
import { loadSubscriptionState, getLimits } from "@/lib/subscription";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Calendar sync is a Pro+ feature.
  const state = await loadSubscriptionState(session.user.id);
  if (state && !getLimits(state).calendarSync) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(
      `${appUrl}/dashboard/billing?upgrade=calendar`
    );
  }

  const url = getAuthUrl(session.user.id);
  return NextResponse.redirect(url);
}
