import { beforeEach, describe, expect, it } from "bun:test";
import { ok } from "neverthrow";
import { ValidationError } from "@/common/errors";
import type { IAppointmentNotificationScheduler } from "./appointment.notification.scheduler";
import { MockAppointmentRepository } from "./appointment.repository.mock";
import { AppointmentService } from "./appointment.service";
import type { CreateAppointmentInput } from "./appointment.types";

const BASE_USER_ID = "00000000-0000-0000-0000-000000000001";

class MockAppointmentNotificationScheduler
	implements IAppointmentNotificationScheduler
{
	public scheduledAppointmentIds: string[] = [];
	public rescheduledAppointmentIds: string[] = [];
	public clearedAppointmentIds: string[] = [];

	async scheduleForAppointment(appointment: { id: string }) {
		this.scheduledAppointmentIds.push(appointment.id);

		return ok(undefined);
	}

	async rescheduleForAppointment(appointment: { id: string }) {
		this.rescheduledAppointmentIds.push(appointment.id);

		return ok(undefined);
	}

	async clearForAppointment(appointmentId: string) {
		this.clearedAppointmentIds.push(appointmentId);

		return ok(undefined);
	}
}

const makeAppointment = (
	overrides: Partial<CreateAppointmentInput> = {},
): CreateAppointmentInput => ({
	title: "Therapy Session",
	startDate: "2026-03-01T10:00:00.000Z",
	endDate: "2026-03-01T11:00:00.000Z",
	userId: BASE_USER_ID,
	...overrides,
});

describe("AppointmentService", () => {
	let repository: MockAppointmentRepository;
	let service: AppointmentService;
	let notificationScheduler: MockAppointmentNotificationScheduler;

	beforeEach(() => {
		repository = new MockAppointmentRepository();
		notificationScheduler = new MockAppointmentNotificationScheduler();
		service = new AppointmentService(repository, notificationScheduler);
		repository.setUsersMap(new Map([[BASE_USER_ID, "John Doe"]]));
	});

	describe("getAllAppointments", () => {
		it("should return all appointments when no filter is provided", async () => {
			await repository.create(makeAppointment());
			await repository.create(makeAppointment({ title: "Second Session" }));

			const result = await service.getAllAppointments();

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value).toHaveLength(2);
				expect(result.value[0].userName).toBe("John Doe");
			}
		});

		it("should return empty list when no appointments exist", async () => {
			const result = await service.getAllAppointments();

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value).toHaveLength(0);
			}
		});

		it("should filter appointments by from date", async () => {
			await repository.create(
				makeAppointment({
					startDate: "2026-02-01T10:00:00.000Z",
					endDate: "2026-02-01T11:00:00.000Z",
				}),
			);
			await repository.create(makeAppointment());

			const result = await service.getAllAppointments({
				from: "2026-03-01T00:00:00.000Z",
			});

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value).toHaveLength(1);
				expect(result.value[0].title).toBe("Therapy Session");
				expect(result.value[0].userName).toBe("John Doe");
			}
		});

		it("should filter appointments by to date", async () => {
			await repository.create(
				makeAppointment({
					startDate: "2026-02-01T10:00:00.000Z",
					endDate: "2026-02-01T11:00:00.000Z",
				}),
			);
			await repository.create(makeAppointment());

			const result = await service.getAllAppointments({
				to: "2026-02-28T23:59:59.000Z",
			});

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value).toHaveLength(1);
				expect(result.value[0].startDate).toEqual(
					new Date("2026-02-01T10:00:00.000Z"),
				);
			}
		});

		it("should filter appointments by from and to date range", async () => {
			await repository.create(
				makeAppointment({
					title: "January",
					startDate: "2026-01-15T10:00:00.000Z",
					endDate: "2026-01-15T11:00:00.000Z",
				}),
			);
			await repository.create(
				makeAppointment({
					title: "February",
					startDate: "2026-02-15T10:00:00.000Z",
					endDate: "2026-02-15T11:00:00.000Z",
				}),
			);
			await repository.create(
				makeAppointment({
					title: "March",
					startDate: "2026-03-15T10:00:00.000Z",
					endDate: "2026-03-15T11:00:00.000Z",
				}),
			);

			const result = await service.getAllAppointments({
				from: "2026-02-01T00:00:00.000Z",
				to: "2026-02-28T23:59:59.000Z",
			});

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value).toHaveLength(1);
				expect(result.value[0].title).toBe("February");
				expect(result.value[0].userName).toBe("John Doe");
			}
		});
	});

	describe("getAppointmentsByUserId", () => {
		it("should return only appointments for the given user", async () => {
			const otherUserId = "00000000-0000-0000-0000-000000000002";

			await repository.create(makeAppointment());
			await repository.create(makeAppointment({ userId: otherUserId }));

			const result = await service.getAppointmentsByUserId(BASE_USER_ID, 1, 10);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value.data).toHaveLength(1);
				expect(result.value.data[0].userId).toBe(BASE_USER_ID);
			}
		});
	});

	describe("getAppointmentById", () => {
		it("should return appointment when it exists", async () => {
			const created = await repository.create(makeAppointment());

			expect(created.isOk()).toBe(true);

			if (created.isOk()) {
				const result = await service.getAppointmentById(created.value.id);

				expect(result.isOk()).toBe(true);

				if (result.isOk()) {
					expect(result.value.title).toBe("Therapy Session");
				}
			}
		});

		it("should return NotFoundError when appointment does not exist", async () => {
			const result = await service.getAppointmentById(
				"00000000-0000-0000-0000-000000000099",
			);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error.name).toBe("NotFoundError");
			}
		});
	});

	describe("createAppointment", () => {
		it("should create appointment with valid data", async () => {
			const input = makeAppointment({ observation: "First session" });

			const result = await service.createAppointment(input);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value.title).toBe("Therapy Session");
				expect(result.value.observation).toBe("First session");
				expect(result.value.userId).toBe(BASE_USER_ID);
				expect(result.value.id).toBeDefined();
				expect(notificationScheduler.scheduledAppointmentIds).toEqual([
					result.value.id,
				]);
			}
		});

		it("should create appointment without observation", async () => {
			const result = await service.createAppointment(makeAppointment());

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value.observation).toBeNull();
			}
		});

		it("should fail when title is empty", async () => {
			const result = await service.createAppointment(
				makeAppointment({ title: "   " }),
			);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Title cannot be empty");
			}
		});

		it("should fail when startDate is not before endDate", async () => {
			const result = await service.createAppointment(
				makeAppointment({
					startDate: "2026-03-01T11:00:00.000Z",
					endDate: "2026-03-01T10:00:00.000Z",
				}),
			);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("startDate must be before endDate");
			}
		});

		it("should fail when startDate equals endDate", async () => {
			const result = await service.createAppointment(
				makeAppointment({
					startDate: "2026-03-01T10:00:00.000Z",
					endDate: "2026-03-01T10:00:00.000Z",
				}),
			);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
			}
		});
	});

	describe("updateAppointment", () => {
		it("should update appointment fields", async () => {
			const created = await repository.create(makeAppointment());

			expect(created.isOk()).toBe(true);

			if (created.isOk()) {
				const result = await service.updateAppointment(created.value.id, {
					title: "Updated Session",
				});

				expect(result.isOk()).toBe(true);

				if (result.isOk()) {
					expect(result.value.title).toBe("Updated Session");
					expect(notificationScheduler.rescheduledAppointmentIds).toEqual([
						created.value.id,
					]);
				}
			}
		});

		it("should update observation to null", async () => {
			const created = await repository.create(
				makeAppointment({ observation: "old note" }),
			);

			expect(created.isOk()).toBe(true);

			if (created.isOk()) {
				const result = await service.updateAppointment(created.value.id, {
					observation: null,
				});

				expect(result.isOk()).toBe(true);

				if (result.isOk()) {
					expect(result.value.observation).toBeNull();
				}
			}
		});

		it("should fail when updating with empty title", async () => {
			const created = await repository.create(makeAppointment());

			expect(created.isOk()).toBe(true);

			if (created.isOk()) {
				const result = await service.updateAppointment(created.value.id, {
					title: "  ",
				});

				expect(result.isErr()).toBe(true);

				if (result.isErr()) {
					expect(result.error).toBeInstanceOf(ValidationError);
				}
			}
		});

		it("should fail when updated dates are invalid", async () => {
			const created = await repository.create(makeAppointment());

			expect(created.isOk()).toBe(true);

			if (created.isOk()) {
				const result = await service.updateAppointment(created.value.id, {
					startDate: "2026-03-01T12:00:00.000Z",
					endDate: "2026-03-01T10:00:00.000Z",
				});

				expect(result.isErr()).toBe(true);

				if (result.isErr()) {
					expect(result.error).toBeInstanceOf(ValidationError);
				}
			}
		});

		it("should return NotFoundError when appointment does not exist", async () => {
			const result = await service.updateAppointment(
				"00000000-0000-0000-0000-000000000099",
				{ title: "Ghost" },
			);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error.name).toBe("NotFoundError");
			}
		});
	});

	describe("deleteAppointment", () => {
		it("should delete appointment successfully", async () => {
			const created = await repository.create(makeAppointment());

			expect(created.isOk()).toBe(true);

			if (created.isOk()) {
				const result = await service.deleteAppointment(created.value.id);

				expect(result.isOk()).toBe(true);
				expect(notificationScheduler.clearedAppointmentIds).toEqual([
					created.value.id,
				]);

				const getResult = await service.getAppointmentById(created.value.id);
				expect(getResult.isErr()).toBe(true);
			}
		});

		it("should return NotFoundError when appointment does not exist", async () => {
			const result = await service.deleteAppointment(
				"00000000-0000-0000-0000-000000000099",
			);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error.name).toBe("NotFoundError");
			}
		});
	});
});
