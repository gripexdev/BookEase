import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { generateCancelToken } from "@/lib/utils";
import { addMinutes } from "date-fns";

export async function POST(req: Request) {
  const { serviceId, startTime, clientName, clientEmail, notes } = await req.json();

  if (!serviceId || !startTime || !clientName || !clientEmail) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: { provider: true },
  });
  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  const start = new Date(startTime);
  const end = addMinutes(start, service.duration);

  // Check for conflicts before creating checkout
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

  // Create a pending booking first
  const booking = await prisma.booking.create({
    data: {
      clientName,
      clientEmail,
      serviceId,
      providerId: service.providerId,
      startTime: start,
      endTime: end,
      status: "PENDING",
      paymentStatus: "UNPAID",
      notes: notes || null,
      cancelToken,
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: clientEmail,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: Math.round(service.price * 100),
          product_data: {
            name: `${service.name} with ${service.provider.name}`,
            description: `${service.duration} minute appointment`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      bookingId: booking.id,
    },
    success_url: `${appUrl}/book/confirm?bookingId=${booking.id}`,
    cancel_url: `${appUrl}/book/${service.provider.slug}`,
  });

  // Save stripe session ID
  await prisma.booking.update({
    where: { id: booking.id },
    data: { stripeSessionId: session.id },
  });

  return NextResponse.json({ url: session.url });
}
