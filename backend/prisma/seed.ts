import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding...");

  const admin = await prisma.user.upsert({
    where: { email: "admin@admin.com" },
    update: {},
    create: {
      email: "admin@admin.com",
      password: "PLACEHOLDER_ADMIN_PASSWORD",
      name: "Admin User",
      role: Role.ADMIN,
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  const user = await prisma.user.upsert({
    where: { email: "user@user.com" },
    update: {},
    create: {
      email: "user@user.com",
      password: "PLACEHOLDER_USER_PASSWORD",
      name: "Regular User",
      role: Role.USER,
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(`✅ User: ${user.email}`);

  console.log("✅ Seeding complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
