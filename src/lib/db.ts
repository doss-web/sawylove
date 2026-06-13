import { PrismaClient } from "@prisma/client";

// PrismaClient singleton for Next.js hot-reload (dev) and serverless cold starts.
// globalThis prevents duplicate clients during `next dev` file watching.
//
// NOTE: In Vercel serverless, each cold start creates a fresh PrismaClient.
// For production scale, consider:
//   - Adding `?pgbouncer=true&connection_limit=3` to DATABASE_URL
//   - Or using Prisma Accelerate / Data Proxy

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
