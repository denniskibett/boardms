// prisma/config.ts
import { defineConfig } from "prisma/config";
import { loadEnvConfig } from '@next/env'

// Load environment variables
loadEnvConfig(process.cwd())

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});