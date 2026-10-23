import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Missing DATABASE_URL environment variable for Prisma adapter.");
}

const connectionUrl = new URL(connectionString);
if (!connectionUrl.searchParams.has("allowPublicKeyRetrieval")) {
  connectionUrl.searchParams.set("allowPublicKeyRetrieval", "true");
}

const adapter = new PrismaMariaDb(connectionUrl.toString());
const prisma = new PrismaClient({ adapter });

export default prisma;
