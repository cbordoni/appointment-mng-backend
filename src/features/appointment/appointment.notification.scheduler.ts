import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { err, ok } from "neverthrow";

import { DomainError } from "@/common/errors";
import { logger } from "@/common/logger";
import type { Appointment } from "@/db/schema";

import type { IAppointmentNotificationScheduler } from "./appointment.notification.scheduler.interface";

const APPOINTMENT_NOTIFICATION_QUEUE = "appointment-notifications";

const HOUR_IN_MS = 60 * 60 * 1000;

const NOTIFICATION_WINDOWS = [
	{ type: "1h", offsetInMs: HOUR_IN_MS },
	{ type: "24h", offsetInMs: 24 * HOUR_IN_MS },
] as const;

type NotificationType = (typeof NOTIFICATION_WINDOWS)[number]["type"];

type AppointmentNotificationJob = {
	appointmentId: string;
	notificationType: NotificationType;
	startDate: string;
};

function createRedisConnection() {
	return new IORedis({
		host: Bun.env.REDIS_HOST ?? "127.0.0.1",
		port: Number(Bun.env.REDIS_PORT ?? 6379),
		password: Bun.env.REDIS_PASSWORD,
		maxRetriesPerRequest: null,
	});
}

function createJobId(
	appointmentId: string,
	notificationType: NotificationType,
) {
	return `${appointmentId}_${notificationType}`;
}

function toErrorMessage(error: unknown) {
	if (error instanceof Error) {
		return error.message;
	}

	return String(error);
}

export class AppointmentNotificationError extends DomainError {
	constructor(message: string) {
		super(message, "APPOINTMENT_NOTIFICATION_ERROR");
		this.name = "AppointmentNotificationError";
	}
}

export class NoopAppointmentNotificationScheduler
	implements IAppointmentNotificationScheduler
{
	async scheduleForAppointment() {
		return ok(undefined);
	}

	async rescheduleForAppointment() {
		return ok(undefined);
	}

	async clearForAppointment() {
		return ok(undefined);
	}
}

export class BullMqAppointmentNotificationScheduler
	implements IAppointmentNotificationScheduler
{
	private readonly queue: Queue<AppointmentNotificationJob>;

	private async upsertNotificationJob(
		appointment: Appointment,
		notificationType: NotificationType,
		offsetInMs: number,
	) {
		const jobId = createJobId(appointment.id, notificationType);
		const existingJob = await this.queue.getJob(jobId);

		const delay =
			new Date(appointment.startDate).getTime() - Date.now() - offsetInMs;

		if (existingJob) {
			await existingJob.remove();
		}

		if (delay <= 0) {
			return logger.warn(
				"Skipping scheduling notification because it's in the past",
				{
					appointmentId: appointment.id,
					notificationType,
				},
			);
		}

		logger.debug(
			`Scheduling notification to be sent in ${delay / 1000} seconds`,
			{
				appointmentId: appointment.id,
				notificationType,
				startDate: appointment.startDate,
			},
		);

		await this.queue.add(
			"send-whatsapp-notification",
			{
				appointmentId: appointment.id,
				notificationType,
				startDate: appointment.startDate.toISOString(),
			},
			{
				jobId,
				delay,
				removeOnComplete: true,
				removeOnFail: true,
			},
		);
	}

	constructor(queue?: Queue<AppointmentNotificationJob>) {
		this.queue =
			queue ??
			new Queue<AppointmentNotificationJob>(APPOINTMENT_NOTIFICATION_QUEUE, {
				connection: createRedisConnection(),
			});
	}

	async scheduleForAppointment(appointment: Appointment) {
		try {
			await Promise.all(
				NOTIFICATION_WINDOWS.map(async ({ type, offsetInMs }) => {
					await this.upsertNotificationJob(appointment, type, offsetInMs);
				}),
			);

			return ok(undefined);
		} catch (error) {
			return err(
				new AppointmentNotificationError(
					`Failed to schedule appointment notifications: ${toErrorMessage(error)}`,
				),
			);
		}
	}

	async rescheduleForAppointment(appointment: Appointment) {
		try {
			await Promise.all(
				NOTIFICATION_WINDOWS.map(async ({ type, offsetInMs }) => {
					await this.upsertNotificationJob(appointment, type, offsetInMs);
				}),
			);

			return ok(undefined);
		} catch (error) {
			return err(
				new AppointmentNotificationError(
					`Failed to reschedule appointment notifications: ${toErrorMessage(error)}`,
				),
			);
		}
	}

	async clearForAppointment(appointmentId: string) {
		try {
			await Promise.all(
				NOTIFICATION_WINDOWS.map(async ({ type }) => {
					const job = await this.queue.getJob(createJobId(appointmentId, type));

					if (!job) {
						return;
					}

					await job.remove();
				}),
			);

			return ok(undefined);
		} catch (error) {
			return err(
				new AppointmentNotificationError(
					`Failed to clear appointment notifications: ${toErrorMessage(error)}`,
				),
			);
		}
	}
}

export function startAppointmentNotificationWorker() {
	const worker = new Worker<AppointmentNotificationJob>(
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
