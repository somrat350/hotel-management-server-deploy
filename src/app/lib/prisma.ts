import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import ENV from "../config/env";

declare global {
  var prisma: PrismaClient | undefined;
}

const connectionString = `${ENV.database_url}`;

const prismaClientSingleton = () => {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log: ["error"],
  });
};

const prisma = global.prisma ?? prismaClientSingleton();

export { prisma };
