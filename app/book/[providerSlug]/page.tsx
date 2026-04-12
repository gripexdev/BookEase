import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { BookingFlow } from "@/components/booking/BookingFlow";

interface Props {
  params: { providerSlug: string };
}

export async function generateMetadata({ params }: Props) {
  const provider = await prisma.user.findUnique({
    where: { slug: params.providerSlug },
  });
  return {
    title: provider ? `Book with ${provider.name} – BookEase` : "Provider not found",
  };
}

export default async function ProviderBookingPage({ params }: Props) {
  const provider = await prisma.user.findUnique({
    where: { slug: params.providerSlug },
    include: {
      services: { orderBy: { createdAt: "asc" } },
      availability: { orderBy: { dayOfWeek: "asc" } },
    },
  });

  if (!provider) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-2xl mx-auto px-4 flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl">
            {provider.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{provider.name}</h1>
            {provider.serviceType && (
              <p className="text-sm text-gray-500">{provider.serviceType}</p>
            )}
            {provider.bio && (
              <p className="text-sm text-gray-600 mt-0.5 max-w-md">{provider.bio}</p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {provider.services.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>This provider hasn&apos;t set up any services yet.</p>
          </div>
        ) : (
          <BookingFlow
            provider={JSON.parse(JSON.stringify(provider))}
            services={JSON.parse(JSON.stringify(provider.services))}
          />
        )}
      </div>
    </div>
  );
}
