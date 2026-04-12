import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "@/components/dashboard/SettingsClient";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const providerId = session.user.id;

  const [user, services, availability] = await Promise.all([
    prisma.user.findUnique({ where: { id: providerId } }),
    prisma.service.findMany({ where: { providerId }, orderBy: { createdAt: "asc" } }),
    prisma.availability.findMany({ where: { providerId }, orderBy: { dayOfWeek: "asc" } }),
  ]);

  return (
    <SettingsClient
      user={JSON.parse(JSON.stringify(user))}
      services={JSON.parse(JSON.stringify(services))}
      availability={JSON.parse(JSON.stringify(availability))}
    />
  );
}
