import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export default {
  schema: ["./drizzle/schema/control.ts", "./drizzle/schema/tenant.ts"],
  out: "./drizzle/migrations",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_CONTROL_DB_URL!,
    authToken: process.env.TURSO_CONTROL_DB_AUTH_TOKEN!,
  },
} satisfies Config;
