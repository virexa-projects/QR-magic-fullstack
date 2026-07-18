import "tsconfig-paths/register";
import { connectDatabase, disconnectDatabase } from "@config/database";
import { Plan } from "@models/Plan.model";
import { User } from "@models/User.model";
import { UserRole } from "@app-types/enums";
import { logger } from "@config/logger";

async function seedPlans() {
  const plans = [
    {
      name: "Free",
      slug: "free",
      price: 0,
      durationDays: 365,
      qrLimit: 5,
      dynamicQrLimit: 1,
      scanLimitPerMonth: 10,
      features: ["5 QR codes", "1 dynamic QR", "Basic analytics","10 scan Limit /month"],
    },
    {
      name: "Starter",
      slug: "starter",
      price: 299,
      durationDays: 30,
      qrLimit: 200,
      dynamicQrLimit: 150,
      scanLimitPerMonth: 100,
      features: ["200 QR codes", "10 dynamic QR", "Full analytics", "Email support","12 scan Limit /month"],
    },
    {
      name: "Business",
      slug: "business",
      price: 999,
      durationDays: 30,
      qrLimit: -1,
      dynamicQrLimit: -1,
      scanLimitPerMonth: -1,
      features: ["Unlimited QR codes", "Unlimited dynamic QR", "Advanced analytics", "Priority support"],
    },
  ];

  for (const plan of plans) {
    await Plan.updateOne({ slug: plan.slug }, { $setOnInsert: plan }, { upsert: true });
  }
  logger.info("Plans seeded");
}

async function seedSuperAdmin() {
  const email = "superadmin@qrbharat.in";
  const existing = await User.findOne({ email });
  if (existing) return;

  await User.create({
    name: "QRBharat Super Admin",
    email,
    password: "ChangeMe@12345",
    role: UserRole.SUPERADMIN,
    isVerified: true,
  });
  logger.info(`Superadmin created: ${email} (change the password immediately)`);
}

async function run() {
  await connectDatabase();
  await seedPlans();
  await seedSuperAdmin();
  await disconnectDatabase();
  process.exit(0);
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Seed failed:", err);
  process.exit(1);
});
