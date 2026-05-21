import { prisma } from "../lib/prisma";
import {
  FLAT_PERMISSIONS,
  ROLE_PERMISSION_MAP,
  ROLES,
} from "../constants/rolePermissions";
import bcrypt from "bcrypt";
import { SystemLevel } from "@prisma/client";
import AuthKeys from "../modules/auth/auth.keys";
import { Cache } from "../lib/cache";
import { connectRedis } from "../config/redis";

// Connect redis
await connectRedis();

/**
 * Seed Roles
 */
const seedRoles = async () => {
  try {
    console.log("🔄 Seeding roles...");

    await prisma.role.createMany({
      data: ROLES,
      skipDuplicates: true,
    });

    console.log(`✅ Successfully seeded ${ROLES.length} roles`);
    return ROLES;
  } catch (error) {
    console.error("❌ Error seeding roles:", error);
    throw error;
  }
};

/**
 * Seed Permissions
 */
const seedPermissions = async () => {
  try {
    console.log("🔄 Seeding permissions...");

    const permissions = await prisma.permission.createMany({
      data: FLAT_PERMISSIONS,
      skipDuplicates: true,
    });

    console.log(
      `✅ Successfully seeded ${FLAT_PERMISSIONS.length} permissions`,
    );
    return permissions;
  } catch (error) {
    console.error("❌ Error seeding permissions:", error);
    throw error;
  }
};

// seedRolePermissions assigns permissions to roles based on a predefined mapping.

const seedRolePermissions = async () => {
  try {
    console.log("🔄 Seeding role permissions...");

    const [roles, permissions] = await Promise.all([
      prisma.role.findMany(),
      prisma.permission.findMany(),
    ]);

    const roleMap = Object.fromEntries(roles.map((r) => [r.name, r.id]));
    const permissionMap = Object.fromEntries(
      permissions.map((p) => [p.name, p.id]),
    );

    const rolePermissionsData: { roleId: string; permissionId: string }[] = [];

    for (const roleName in ROLE_PERMISSION_MAP) {
      const roleId = roleMap[roleName];
      if (!roleId) continue;

      const perms =
        ROLE_PERMISSION_MAP[roleName as keyof typeof ROLE_PERMISSION_MAP];

      for (const permName of perms) {
        const permissionId = permissionMap[permName];
        if (!permissionId) continue;

        rolePermissionsData.push({ roleId, permissionId });
      }
    }

    await prisma.rolePermission.createMany({
      data: rolePermissionsData,
      skipDuplicates: true,
    });

    console.log(
      `✅ Successfully seeded ${rolePermissionsData.length} role permissions`,
    );

    console.log("⚡ Warming Redis role permission cache...");

    const rolesWithPermissions = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        rolePermissions: {
          select: {
            permission: { select: { name: true } },
          },
        },
      },
    });

    for (const role of rolesWithPermissions) {
      // we only cache ADMIN & VENDOR roles (as requested)
      if (role.name !== SystemLevel.ADMIN && role.name !== SystemLevel.VENDOR)
        continue;

      const permissionNames = role.rolePermissions.map(
        (rp) => rp.permission.name,
      );

      const cacheKey = AuthKeys.rolePermission(role.id);
      await Cache.set(cacheKey, permissionNames, 60 * 60 * 24 * 30); // 30 days

      console.log(`Cached permissions for role: ${role.name}`);
    }

    console.log("Redis role permission warm completed");
  } catch (error) {
    console.error("❌ Error seeding role permissions:", error);
    throw error;
  }
};

/**
 * Seed Users (Vendor, Admin, Customer)
 */
const seedUsers = async () => {
  try {
    console.log("🔄 Seeding users...");

    const roles = await prisma.role.findMany();
    const roleMap = Object.fromEntries(roles.map((r) => [r.name, r.id]));

    if (!roleMap["VENDOR"] || !roleMap["ADMIN"] || !roleMap["CUSTOMER"]) {
      console.log("❌ Required roles not found. Please run seedRoles first.");
      return;
    }

    const hashedPassword = await bcrypt.hash("password123", 10);

    // Create Vendor User
    const vendorUser = await prisma.user.upsert({
      where: { email: "vendor@hotel.com" },
      update: {},
      create: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "John Vendor",
        email: "vendor@hotel.com",
        phone: "+8801234567890",
        password: hashedPassword,
        status: "ACTIVE",
        isVerified: true,
      },
    });

    // Create Vendor entry linking User to VENDOR role
    await prisma.vendor.upsert({
      where: { userId: vendorUser.id },
      update: {},
      create: {
        userId: vendorUser.id,
        roleId: roleMap["VENDOR"],
      },
    });
    console.log(`✅ Vendor user: ${vendorUser.email}`);

    // Create Admin User
    const adminUser = await prisma.user.upsert({
      where: { email: "admin@hotel.com" },
      update: {},
      create: {
        id: "550e8400-e29b-41d4-a716-446655440001",
        name: "Jane Admin",
        email: "admin@hotel.com",
        phone: "+8801234567891",
        password: hashedPassword,
        status: "ACTIVE",
        isVerified: true,
      },
    });

    // Create Admin entry linking User to ADMIN role
    await prisma.admin.upsert({
      where: { userId: adminUser.id },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: roleMap["ADMIN"],
      },
    });
    console.log(`✅ Admin user: ${adminUser.email}`);

    // Create Customer User
    const customerUser = await prisma.user.upsert({
      where: { email: "customer@example.com" },
      update: {},
      create: {
        id: "550e8400-e29b-41d4-a716-446655440002",
        name: "Bob Customer",
        email: "customer@example.com",
        phone: "+8801234567892",
        password: hashedPassword,
        status: "ACTIVE",
        isVerified: true,
      },
    });
    console.log(`✅ Customer user: ${customerUser.email}`);

    // Create Additional Customer Users for chat testing
    const customer2 = await prisma.user.upsert({
      where: { email: "sarah@example.com" },
      update: {},
      create: {
        id: "550e8400-e29b-41d4-a716-446655440003",
        name: "Sarah Johnson",
        email: "sarah@example.com",
        phone: "+8801234567893",
        password: hashedPassword,
        status: "ACTIVE",
        isVerified: true,
      },
    });
    console.log(`✅ Customer user: ${customer2.email}`);

    console.log("✅ Successfully seeded 4 users");
  } catch (error) {
    console.error("❌ Error seeding users:", error);
    throw error;
  }
};

/**
 * Main seed function
 * Orchestrates all seeding operations in order
 */
async function seedInitialData() {
  try {
    console.log("🌱 Starting database seeding...\n");

    await seedRoles();
    console.log("");

    await seedPermissions();
    console.log("");

    await seedRolePermissions();
    console.log("");

    // await seedUsers();
    console.log("");

    console.log("✨ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedInitialData();
