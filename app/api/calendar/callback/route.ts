import { NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CALENDAR_CLIENT_ID,
  process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
  process.env.GOOGLE_CALENDAR_REDIRECT_URI
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const providerId = searchParams.get("state");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!code || !providerId) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings?calendarError=true`);
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    // Store tokens in user's account
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: "google-calendar",
          providerAccountId: providerId,
        },
      },
      update: {
        access_token: tokens.access_token || undefined,
        refresh_token: tokens.refresh_token || undefined,
        expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : undefined,
      },
      create: {
        userId: providerId,
        type: "oauth",
        provider: "google-calendar",
        providerAccountId: providerId,
        access_token: tokens.access_token || undefined,
        refresh_token: tokens.refresh_token || undefined,
        expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : undefined,
      },
    });

    return NextResponse.redirect(`${appUrl}/dashboard/settings?calendarConnected=true`);
  } catch (err) {
    console.error("Calendar OAuth error:", err);
    return NextResponse.redirect(`${appUrl}/dashboard/settings?calendarError=true`);
  }
}
