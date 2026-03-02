import type { Queue } from "bullmq";
import { err, ok } from "neverthrow";

import { DomainError, toErrorMessage } from "@/common/errors";
import { logger } from "@/common/logger";

import { NOTIFICATION_WINDOWS } from "./scheduler.constants";
import type { IScheduler } from "./scheduler.interface";
import type {
	ScheduledJob,
	SchedulingInput,
	SchedulingWindow,
} from "./scheduler.types";

export class SchedulingError extends DomainError {
	constructor(message: string) {
		super(message, "SCHEDULING_ERROR");
		this.name = "SchedulingError";
	}
}

export class SchedulerService implements IScheduler {
	constructor(private readonly queue: Queue<ScheduledJob>) {}

	private createJobId(id: string, type: SchedulingWindow["type"]) {
		return `${id}_${type}`;
	}

	private async upsert(
		data: SchedulingInput,
		notificationType: SchedulingWindow["type"],
		offset: number,
	) {
		const jobId = this.createJobId(data.id, notificationType);
		const existingJob = await this.queue.getJob(jobId);

		const delay = data.startDate.getTime() - Date.now() - offset;

		if (existingJob) {
			await existingJob.remove();
		}

		if (delay <= 0) {
			return logger.warn(
				"Skipping scheduling notification because it's in the past",
				{ id: data.id, window: notificationType },
			);
		}

		await this.queue.add(
			"send-whatsapp-notification",
			{ id: data.id, window: notificationType },
			{ jobId, delay, removeOnComplete: true, removeOnFail: true },
		);
	}

	async run(fn: (window: SchedulingWindow) => Promise<void>, message: string) {
		return await Promise.all(NOTIFICATION_WINDOWS.map(fn)).then(
			() => ok(undefined),
			(error) =>
				err(new SchedulingError(`${message}: ${toErrorMessage(error)}`)),
		);
	}

	async schedule(data: SchedulingInput) {
		return await this.run(
			async ({ type, offset }) => this.upsert(data, type, offset),
			"Failed to schedule",
		);
	}

	async reschedule(data: SchedulingInput) {
		return await this.run(
			async ({ type, offset }) => this.upsert(data, type, offset),
			"Failed to reschedule",
		);
	}

	async clear(id: SchedulingInput["id"]) {
		return await this.run(async ({ type }) => {
			const job = await this.queue.getJob(this.createJobId(id, type));
			job && (await job.remove());
		}, "Failed to clear");
	}
}
