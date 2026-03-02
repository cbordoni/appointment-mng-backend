import { Worker } from "bullmq";

import { toErrorMessage } from "@/common/errors";
import { logger } from "@/common/logger";

import {
	APPOINTMENT_NOTIFICATION_QUEUE,
	createRedisConnection,
} from "./scheduler.constants";
import type { ScheduledJob } from "./scheduler.types";

export function startAppointmentNotificationWorker() {
	const worker = new Worker<ScheduledJob>(
		APPOINTMENT_NOTIFICATION_QUEUE,
		async (job) => logger.info("Agendado pro zap", job.data),
		{ connection: createRedisConnection() },
	);

	worker.on("failed", (_, error) => {
		logger.error("Appointment notification worker failed", {
			error: toErrorMessage(error),
		});
	});

	worker.on("error", (error) => {
		logger.error("Appointment notification worker error", {
			error: toErrorMessage(error),
		});
	});

	return worker;
}
