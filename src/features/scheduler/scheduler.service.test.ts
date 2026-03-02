import { describe, expect, it } from "bun:test";

import type { Queue } from "bullmq";

import { SchedulerService, SchedulingError } from "./scheduler.service";
import type { ScheduledJob } from "./scheduler.types";

class JobMock {
	public removed = 0;

	constructor(public readonly id: string) {}

	async remove() {
		this.removed += 1;
	}
}

class QueueMock {
	public addedJobs: Array<{
		name: string;
		data: ScheduledJob;
		opts: {
			jobId: string;
			delay: number;
			removeOnComplete: boolean;
			removeOnFail: boolean;
		};
	}> = [];

	public shouldThrowOnGetJob = false;
	public shouldThrowOnAdd = false;
	private readonly jobs = new Map<string, JobMock>();

	setExistingJob(jobId: string) {
		const job = new JobMock(jobId);
		this.jobs.set(jobId, job);

		return job;
	}

	async getJob(jobId: string) {
		if (this.shouldThrowOnGetJob) {
			throw new Error("getJob failed");
		}

		return this.jobs.get(jobId) ?? null;
	}

	async add(
		name: string,
		data: ScheduledJob,
		opts: {
			jobId: string;
			delay: number;
			removeOnComplete: boolean;
			removeOnFail: boolean;
		},
	) {
		if (this.shouldThrowOnAdd) {
			throw new Error("add failed");
		}

		this.addedJobs.push({ name, data, opts });

		const job = new JobMock(opts.jobId);
		this.jobs.set(opts.jobId, job);

		return job;
	}
}

describe("SchedulerService", () => {
	it("should schedule jobs for all notification windows", async () => {
		const queue = new QueueMock();
		const service = new SchedulerService(
			queue as unknown as Queue<ScheduledJob>,
		);

		const result = await service.schedule({
			id: "appointment-1",
			startDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
		});

		expect(result.isOk()).toBe(true);
		expect(queue.addedJobs).toHaveLength(2);

		const jobIds = queue.addedJobs.map((job) => job.opts.jobId);

		expect(jobIds).toContain("appointment-1_1h");
		expect(jobIds).toContain("appointment-1_24h");
		expect(queue.addedJobs.every((job) => job.opts.delay > 0)).toBe(true);
	});

	it("should reschedule jobs by removing existing and creating new ones", async () => {
		const queue = new QueueMock();
		const existingOneHour = queue.setExistingJob("appointment-1_1h");
		const existingTwentyFourHour = queue.setExistingJob("appointment-1_24h");
		const service = new SchedulerService(
			queue as unknown as Queue<ScheduledJob>,
		);

		const result = await service.reschedule({
			id: "appointment-1",
			startDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
		});

		expect(result.isOk()).toBe(true);
		expect(existingOneHour.removed).toBe(1);
		expect(existingTwentyFourHour.removed).toBe(1);
		expect(queue.addedJobs).toHaveLength(2);
	});

	it("should not schedule jobs when notification time is in the past", async () => {
		const queue = new QueueMock();
		const service = new SchedulerService(
			queue as unknown as Queue<ScheduledJob>,
		);

		const result = await service.schedule({
			id: "appointment-1",
			startDate: new Date(Date.now() + 10 * 60 * 1000),
		});

		expect(result.isOk()).toBe(true);
		expect(queue.addedJobs).toHaveLength(0);
	});

	it("should clear existing jobs for all notification windows", async () => {
		const queue = new QueueMock();
		const existingOneHour = queue.setExistingJob("appointment-1_1h");
		const existingTwentyFourHour = queue.setExistingJob("appointment-1_24h");
		const service = new SchedulerService(
			queue as unknown as Queue<ScheduledJob>,
		);

		const result = await service.clear("appointment-1");

		expect(result.isOk()).toBe(true);
		expect(existingOneHour.removed).toBe(1);
		expect(existingTwentyFourHour.removed).toBe(1);
	});

	it("should return SchedulingError when queue add fails", async () => {
		const queue = new QueueMock();
		queue.shouldThrowOnAdd = true;
		const service = new SchedulerService(
			queue as unknown as Queue<ScheduledJob>,
		);

		const result = await service.schedule({
			id: "appointment-1",
			startDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
		});

		expect(result.isErr()).toBe(true);

		if (result.isErr()) {
			expect(result.error).toBeInstanceOf(SchedulingError);
			expect(result.error.message).toContain("Failed to schedule");
			expect(result.error.message).toContain("add failed");
		}
	});

	it("should return SchedulingError when queue getJob fails on clear", async () => {
		const queue = new QueueMock();
		queue.shouldThrowOnGetJob = true;
		const service = new SchedulerService(
			queue as unknown as Queue<ScheduledJob>,
		);

		const result = await service.clear("appointment-1");

		expect(result.isErr()).toBe(true);

		if (result.isErr()) {
			expect(result.error).toBeInstanceOf(SchedulingError);
			expect(result.error.message).toContain("Failed to clear");
			expect(result.error.message).toContain("getJob failed");
		}
	});
});
