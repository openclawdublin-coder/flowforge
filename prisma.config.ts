import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Use DIRECT_URL for migrations (required with Supabase pooler/pgbouncer)
    url: env("DIRECT_URL"),
  },
});
