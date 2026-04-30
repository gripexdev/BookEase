import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing database...");
  // Delete in reverse dependency order
  await prisma.booking.deleteMany();
  await prisma.blockedSlot.deleteMany();
  await prisma.service.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating test account...");
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  const user = await prisma.user.create({
    data: {
      name: "Alex Thompson",
      email: "test@example.com",
      password: await bcrypt.hash("password123", 12),
      slug: "alex-thompson",
      role: "PROVIDER",
      bio: "Professional therapist specializing in wellness",
      serviceType: "Therapist",
      plan: "PRO",
      planStatus: "TRIALING",
      trialEndsAt,
    },
  });

  console.log("Creating services...");
  const service1 = await prisma.service.create({
    data: {
      providerId: user.id,
      name: "Therapy Session",
      duration: 60,
      price: 100,
    },
  });

  const service2 = await prisma.service.create({
    data: {
      providerId: user.id,
      name: "Initial Consultation",
      duration: 30,
      price: 50,
    },
  });

  console.log("Setting availability (Mon-Fri, 9am-5pm)...");
  for (let day = 1; day <= 5; day++) {
    // 1=Monday, 5=Friday
    await prisma.availability.create({
      data: {
        providerId: user.id,
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "17:00",
      },
    });
  }

  console.log("\n✅ Test account created!");
  console.log(`   Email: test@example.com`);
  console.log(`   Password: password123`);
  console.log(`   Plan: PRO (14-day trial)`);
  console.log(`   Services: Therapy Session (60 min, $100), Initial Consultation (30 min, $50)`);
  console.log(`   Availability: Mon-Fri 9am-5pm`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
