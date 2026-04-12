import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CALENDAR_CLIENT_ID,
  process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
  process.env.GOOGLE_CALENDAR_REDIRECT_URI
);

export function getAuthUrl(providerId: string) {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar.events"],
    state: providerId,
    prompt: "consent",
  });
}

export async function getCalendarClient(tokens: { access_token: string; refresh_token?: string }) {
  oauth2Client.setCredentials(tokens);
  return google.calendar({ version: "v3", auth: oauth2Client });
}

export async function createCalendarEvent(
  tokens: { access_token: string; refresh_token?: string },
  booking: {
    clientName: string;
    clientEmail: string;
    startTime: Date | string;
    endTime: Date | string;
    serviceName: string;
    providerName: string;
  }
) {
  const calendar = await getCalendarClient(tokens);

  const event = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: `${booking.serviceName} – ${booking.clientName}`,
      description: `Booking for ${booking.clientName} (${booking.clientEmail})`,
      start: { dateTime: new Date(booking.startTime).toISOString() },
      end: { dateTime: new Date(booking.endTime).toISOString() },
      attendees: [{ email: booking.clientEmail, displayName: booking.clientName }],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 },
          { method: "popup", minutes: 30 },
        ],
      },
    },
  });

  return event.data;
}
