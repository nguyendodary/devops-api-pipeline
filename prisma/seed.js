const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("Admin123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      email: "user@example.com",
      password: hashedPassword,
      firstName: "John",
      lastName: "Doe",
      role: "USER",
    },
  });

  await prisma.task.createMany({
    data: [
      {
        title: "Setup CI/CD Pipeline",
        description:
          "Configure GitHub Actions for automated testing and deployment",
        status: "COMPLETED",
        priority: "HIGH",
        userId: admin.id,
      },
      {
        title: "Write API Documentation",
        description: "Document all REST API endpoints with examples",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        userId: admin.id,
      },
      {
        title: "Review Pull Request #42",
        description: "Review and merge the authentication feature branch",
        status: "PENDING",
        priority: "HIGH",
        userId: user.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed data created successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
