import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// For local development, we'll use a URL-encoded connection string
const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/moveease";

export const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });