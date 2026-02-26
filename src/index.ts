import { logger } from "@/common/logger";
import { syncDatabase } from "@/db";
import { startAppointmentNotificationWorker } from "@/features/appointment/appointment.notification.scheduler";

import { app } from "./app";

const PORT = Bun.env.PORT || 3000;

startAppointmentNotificationWorker();

// Sync database if DB_SYNC flag is set
if (Bun.env.DB_SYNC === "true") {
	logger.info("Syncing database...");

	await syncDatabase().then(
		() => {
			logger.info("Database synced successfully");
		},
		(e) => {
			logger.error("Failed to sync database", {
				error: e instanceof Error ? e.message : String(e),
			});

			process.exit(1);
		},
	);
}

app.listen(PORT);

logger.info("Server started", {
	hostname: app.server?.hostname,
	port: app.server?.port,
	environment: Bun.env.NODE_ENV || "development",
});
