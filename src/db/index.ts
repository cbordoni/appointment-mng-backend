import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import { logger } from "@/common/logger";
import * as schema from "@/db/schema";

const connectionString = Bun.env.DATABASE_URL;

const getClient = () => {
	if (!connectionString) {
		throw new Error("DATABASE_URL is not defined in environment variables.");
	}

	return postgres(connectionString);
};

export const db = drizzle(getClient(), { schema });

export async function syncDatabase(): Promise<void> {
	if (!connectionString) {
		throw new Error("DATABASE_URL is not defined in environment variables.");
	}

	const migrationClient = postgres(connectionString, { max: 1 });
	try {
		logger.info("Running database migrations...");
		await migrate(drizzle(migrationClient), { migrationsFolder: "./drizzle" });
		logger.info("Database migrations completed successfully");
	} finally {
		await migrationClient.end();
	}
}
