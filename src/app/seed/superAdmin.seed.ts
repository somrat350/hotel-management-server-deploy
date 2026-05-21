import { SystemLevel, UserStatus } from "@prisma/client";
import bcrypt from "bcrypt";
import ENV from "../config/env";
import { prisma } from "../lib/prisma";

async function seedSuperAdmin() {
  try {
    console.log("Checking SUPER_ADMIN...");

    const role = await prisma.role.findFirst({
      where: { name: SystemLevel.ADMIN },
    });
    if (!role) {
      throw new Error("ADMIN role not found");
    }

    const email = ENV.SUPER_ADMIN_EMAIL;
    const name = ENV.SUPER_ADMIN_NAME;
    const password = ENV.SUPER_ADMIN_PASS;
    const phone = ENV.SUPER_ADMIN_PHONE;
    if (!email || !password || !name || !phone)
      return console.log("Admin data not provided!");

    const existingSuperAdmin = await prisma.user.findUnique({
      where: { email: ENV.SUPER_ADMIN_EMAIL },
    });

    if (existingSuperAdmin) {
      console.log("SUPER_ADMIN already exists");
      return;
    }

    console.log("Creating SUPER_ADMIN...");

    const hashedPassword = await bcrypt.hash(ENV.SUPER_ADMIN_PASS!, 10);

    await prisma.$transaction(async (tx) => {
      const superAdmin = await tx.user.create({
        data: {
          name,
          email,
          phone,
          password: hashedPassword,
          avatar: "",
          avatarId: "",
          isVerified: true,
          status: UserStatus.ACTIVE,
        },
      });
      await tx.admin.create({
        data: {
          userId: superAdmin.id,
          roleId: role.id,
        },
      });
    });

    console.log("ADMIN created successfully!");
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

seedSuperAdmin();
