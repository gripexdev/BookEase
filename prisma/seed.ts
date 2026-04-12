import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, addHours, setHours, setMinutes, startOfDay } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean up
  await prisma.booking.deleteMany();
  await prisma.blockedSlot.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany({ where: { email: "demo@bookease.app" } });

  // Create demo provider
  const hashedPassword = await bcrypt.hash("password123", 12);
  const provider = await prisma.user.create({
    data: {
      name: "Dr. Alex Thompson",
      email: "demo@bookease.app",
      password: hashedPassword,
      role: "PROVIDER",
      slug: "alex-thompson",
      serviceType: "Therapist",
      bio: "Licensed therapist with 10+ years of experience in cognitive behavioral therapy and mindfulness-based stress reduction.",
    },
  });
  console.log(`✅ Created provider: ${provider.email}`);

  // Create services
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: "Initial Consultation",
        duration: 60,
        price: 150,
        providerId: provider.id,
      },
    }),
    prisma.service.create({
      data: {
        name: "Follow-up Session",
        duration: 45,
        price: 120,
        providerId: provider.id,
      },
    }),
    prisma.service.create({
      data: {
        name: "Couples Therapy",
        duration: 90,
        price: 200,
        providerId: provider.id,
      },
    }),
  ]);
  console.log(`✅ Created ${services.length} services`);

  // Set availability: Monday–Friday 9am–5pm
  const availabilityData = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
    providerId: provider.id,
    dayOfWeek,
    startTime: "09:00",
    endTime: "17:00",
  }));
  await prisma.availability.createMany({ data: availabilityData });
  console.log("✅ Set Monday–Friday availability (9am–5pm)");

  // Block lunch on next Monday
  const today = startOfDay(new Date());
  let nextMonday = addDays(today, 1);
  while (nextMonday.getDay() !== 1) nextMonday = addDays(nextMonday, 1);

  await prisma.blockedSlot.create({
    data: {
      providerId: provider.id,
      date: nextMonday,
      startTime: "12:00",
      endTime: "13:00",
      reason: "Lunch break",
    },
  });
  console.log("✅ Blocked lunch slot on Monday");

  // Create sample bookings
  const nextTuesday = addDays(nextMonday, 1);
  const nextWednesday = addDays(nextMonday, 2);

  const bookings = await Promise.all([
    prisma.booking.create({
      data: {
        clientName: "Sarah Johnson",
        clientEmail: "sarah@example.com",
        serviceId: services[0].id,
        providerId: provider.id,
        startTime: setMinutes(setHours(nextTuesday, 10), 0),
        endTime: setMinutes(setHours(nextTuesday, 11), 0),
        status: "CONFIRMED",
        paymentStatus: "PAID",
        stripeSessionId: "cs_test_demo_001",
        cancelToken: "cancel_demo_001",
      },
    }),
    prisma.booking.create({
      data: {
        clientName: "Michael Chen",
        clientEmail: "michael@example.com",
        serviceId: services[1].id,
        providerId: provider.id,
        startTime: setMinutes(setHours(nextTuesday, 14), 0),
        endTime: setMinutes(setHours(nextTuesday, 14), 45),
        status: "CONFIRMED",
        paymentStatus: "PAID",
        cancelToken: "cancel_demo_002",
      },
    }),
    prisma.booking.create({
      data: {
        clientName: "Emily & David Park",
        clientEmail: "emily@example.com",
        serviceId: services[2].id,
        providerId: provider.id,
        startTime: setMinutes(setHours(nextWednesday, 15), 0),
        endTime: setMinutes(setHours(nextWednesday, 16), 30),
        status: "CONFIRMED",
        paymentStatus: "UNPAID",
        notes: "First couples session",
        cancelToken: "cancel_demo_003",
      },
    }),
    prisma.booking.create({
      data: {
        clientName: "James Wilson",
        clientEmail: "james@example.com",
        serviceId: services[0].id,
        providerId: provider.id,
        startTime: setMinutes(setHours(addDays(today, -7), 10), 0),
        endTime: setMinutes(setHours(addDays(today, -7), 11), 0),
        status: "CANCELLED",
        paymentStatus: "REFUNDED",
        cancelToken: "cancel_demo_004",
      },
    }),
  ]);
  console.log(`✅ Created ${bookings.length} sample bookings`);

  console.log("\n🎉 Seed complete!");
  console.log("\n📋 Demo credentials:");
  console.log("   Email:    demo@bookease.app");
  console.log("   Password: password123");
  console.log(`   Booking:  http://localhost:3000/book/alex-thompson`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
