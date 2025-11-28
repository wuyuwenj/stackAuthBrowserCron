import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load .env.local first (higher priority), then .env as fallback
dotenv.config({ path: ".env.local" });
dotenv.config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
