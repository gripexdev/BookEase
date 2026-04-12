import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const providerId = session.user.id;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [bookings, monthBookings, services] = await Promise.all([
    prisma.booking.findMany({
      where: { providerId, startTime: { gte: now } },
      include: { service: true },
      orderBy: { startTime: "asc" },
      take: 50,
    }),
    prisma.booking.findMany({
      where: { providerId, createdAt: { gte: startOfMonth } },
      include: { service: true },
    }),
    prisma.service.findMany({ where: { providerId } }),
  ]);

  const totalBookings = monthBookings.length;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const confirmedBookings = (monthBookings as any[]).filter((b) => b.status !== "CANCELLED");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cancelledBookings = (monthBookings as any[]).filter((b) => b.status === "CANCELLED");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const revenue = (monthBookings as any[])
    .filter((b) => b.paymentStatus === "PAID")
    .reduce((sum: number, b) => sum + b.service.price, 0);
  const cancellationRate = totalBookings > 0
    ? Math.round((cancelledBookings.length / totalBookings) * 100)
    : 0;

  return (
    <DashboardClient
      upcomingBookings={JSON.parse(JSON.stringify(bookings))}
      kpis={{ totalBookings, revenue, cancellationRate, confirmedBookings: confirmedBookings.length }}
      services={JSON.parse(JSON.stringify(services))}
      providerId={providerId}
    />
  );
}
