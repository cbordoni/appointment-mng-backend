import { beforeEach, describe, expect, it } from "bun:test";
import { ok } from "neverthrow";

import { ValidationError } from "@/common/errors";
import type { IScheduler } from "../scheduler/scheduler.interface";
import { MockAppointmentRepository } from "./appointment.repository.mock";
import { AppointmentService } from "./appointment.service";
import type { CreateAppointmentInput } from "./appointment.types";
import { AppointmentEventService } from "./event/event.service";
import { AppointmentProjectionService } from "./projection/projection.service";

const BASE_CLIENT_ID = "00000000-0000-0000-0000-000000000001";
const BASE_PROFESSIONAL_ID = "00000000-0000-0000-0000-000000000010";

class MockAppointmentNotificationScheduler implements IScheduler {
	public scheduledAppointmentIds: string[] = [];
	public rescheduledAppointmentIds: string[] = [];
	public clearedAppointmentIds: string[] = [];

	async schedule(appointment: { id: string }) {
		this.scheduledAppointmentIds.push(appointment.id);

		return ok(undefined);
	}

	async reschedule(appointment: { id: string }) {
		this.rescheduledAppointmentIds.push(appointment.id);

		return ok(undefined);
	}

	async clear(appointmentId: string) {
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
	clientId: BASE_CLIENT_ID,
	professionalId: BASE_PROFESSIONAL_ID,
	...overrides,
});

describe("AppointmentService", () => {
	let repository: MockAppointmentRepository;
	let service: AppointmentService;
	let projectionService: AppointmentProjectionService;
	let eventService: AppointmentEventService;
	let notificationScheduler: MockAppointmentNotificationScheduler;

	beforeEach(() => {
		repository = new MockAppointmentRepository();
		notificationScheduler = new MockAppointmentNotificationScheduler();
		service = new AppointmentService(repository, notificationScheduler);
		projectionService = new AppointmentProjectionService(repository);
		eventService = new AppointmentEventService(repository);
		repository.setClientsMap(new Map([[BASE_CLIENT_ID, "John Doe"]]));
		repository.setProfessionalsMap(
			new Map([[BASE_PROFESSIONAL_ID, "Dr. Alice Smith"]]),
		);
	});

	describe("getAllAppointments", () => {
		it("should return all appointments when no filter is provided", async () => {
			await repository.create(makeAppointment());
			await repository.create(makeAppointment({ title: "Second Session" }));

			const result = await service.getAllAppointments();

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value).toHaveLength(2);
				expect(result.value[0].clientName).toBe("John Doe");
				expect(result.value[0].professionalName).toBe("Dr. Alice Smith");
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
				expect(result.value[0].clientName).toBe("John Doe");
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
				expect(result.value[0].clientName).toBe("John Doe");
			}
		});
	});

	describe("getAppointmentsByClientId", () => {
		it("should return only appointments for the given client", async () => {
			const otherClientId = "00000000-0000-0000-0000-000000000002";

			await repository.create(makeAppointment());
			await repository.create(makeAppointment({ clientId: otherClientId }));

			const result = await service.getAppointmentsByClientId(
				BASE_CLIENT_ID,
				1,
				10,
			);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value.data).toHaveLength(1);
				expect(result.value.data[0].clientId).toBe(BASE_CLIENT_ID);
			}
		});
	});

	describe("AppointmentProjectionService > getProjectedAppointments", () => {
		it("should project weekly recurring appointments within range", async () => {
			await repository.create(
				makeAppointment({
					title: "Weekly Therapy",
					startDate: "2026-03-01T10:00:00.000Z",
					endDate: "2026-03-01T11:00:00.000Z",
					recurrence: "weekly",
				}),
			);

			const result = await projectionService.getProjectedAppointments({
				from: "2026-03-01T00:00:00.000Z",
				to: "2026-03-20T23:59:59.000Z",
			});

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value).toHaveLength(3);
				expect(result.value[0].title).toBe("Weekly Therapy");
				expect(result.value[0].recurrence).toBe("weekly");
			}
		});

		it("should not project appointments with recurrence none", async () => {
			await repository.create(makeAppointment());

			const result = await projectionService.getProjectedAppointments({
				from: "2026-03-01T00:00:00.000Z",
				to: "2026-03-31T23:59:59.000Z",
			});

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value).toHaveLength(0);
			}
		});

		it("should not project inactive recurring appointments", async () => {
			await repository.create(
				makeAppointment({
					title: "Inactive Weekly",
					startDate: "2026-03-01T10:00:00.000Z",
					endDate: "2026-03-01T11:00:00.000Z",
					recurrence: "weekly",
					active: false,
				}),
			);

			const result = await projectionService.getProjectedAppointments({
				from: "2026-03-01T00:00:00.000Z",
				to: "2026-03-31T23:59:59.000Z",
			});

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value).toHaveLength(0);
			}
		});
	});

	describe("AppointmentProjectionService > getCalendarAppointments", () => {
		it("should merge non-recurring and projected recurring appointments sorted by startDate", async () => {
			await repository.create(
				makeAppointment({
					title: "One-time Session",
					startDate: "2026-03-03T10:00:00.000Z",
					endDate: "2026-03-03T11:00:00.000Z",
					recurrence: "none",
				}),
			);

			await repository.create(
				makeAppointment({
					title: "Weekly Therapy",
					startDate: "2026-03-01T10:00:00.000Z",
					endDate: "2026-03-01T11:00:00.000Z",
					recurrence: "weekly",
				}),
			);

			const result = await projectionService.getCalendarAppointments({
				from: "2026-03-01T00:00:00.000Z",
				to: "2026-03-10T23:59:59.000Z",
			});

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value).toHaveLength(3);
				expect(result.value[0].title).toBe("Weekly Therapy");
				expect(result.value[1].title).toBe("One-time Session");
				expect(result.value[1].recurrence).toBe("none");
			}
		});

		it("should not include deleted non-recurring appointments", async () => {
			const oneTime = await repository.create(
				makeAppointment({
					title: "Deleted Session",
					startDate: "2026-03-03T10:00:00.000Z",
					endDate: "2026-03-03T11:00:00.000Z",
					recurrence: "none",
				}),
			);

			expect(oneTime.isOk()).toBe(true);

			if (oneTime.isOk()) {
				await repository.delete(oneTime.value.id);
			}

			const result = await projectionService.getCalendarAppointments({
				from: "2026-03-01T00:00:00.000Z",
				to: "2026-03-10T23:59:59.000Z",
			});

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value).toHaveLength(0);
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
				expect(result.value.clientId).toBe(BASE_CLIENT_ID);
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

		it("should fail when professional has conflict in appointments", async () => {
			await repository.create(
				makeAppointment({
					startDate: "2026-03-01T10:00:00.000Z",
					endDate: "2026-03-01T11:00:00.000Z",
				}),
			);

			const result = await service.createAppointment(
				makeAppointment({
					startDate: "2026-03-01T10:30:00.000Z",
					endDate: "2026-03-01T11:30:00.000Z",
				}),
			);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe(
					"Professional has scheduling conflict for the selected period",
				);
			}
		});

		it("should fail when professional has conflict in projection", async () => {
			await repository.create(
				makeAppointment({
					title: "Weekly session",
					startDate: "2026-03-01T10:00:00.000Z",
					endDate: "2026-03-01T11:00:00.000Z",
					recurrence: "weekly",
				}),
			);

			const result = await service.createAppointment(
				makeAppointment({
					startDate: "2026-03-08T10:15:00.000Z",
					endDate: "2026-03-08T10:45:00.000Z",
				}),
			);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe(
					"Professional has scheduling conflict for the selected period",
				);
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

		it("should fail when updating to conflicting appointment period", async () => {
			const target = await repository.create(
				makeAppointment({
					title: "Target",
					startDate: "2026-03-01T08:00:00.000Z",
					endDate: "2026-03-01T09:00:00.000Z",
				}),
			);

			await repository.create(
				makeAppointment({
					title: "Busy slot",
					startDate: "2026-03-01T10:00:00.000Z",
					endDate: "2026-03-01T11:00:00.000Z",
				}),
			);

			expect(target.isOk()).toBe(true);

			if (target.isOk()) {
				const result = await service.updateAppointment(target.value.id, {
					startDate: "2026-03-01T10:15:00.000Z",
					endDate: "2026-03-01T10:45:00.000Z",
				});

				expect(result.isErr()).toBe(true);

				if (result.isErr()) {
					expect(result.error).toBeInstanceOf(ValidationError);
					expect(result.error.message).toBe(
						"Professional has scheduling conflict for the selected period",
					);
				}
			}
		});

		it("should fail when updating to conflicting projected period", async () => {
			const target = await repository.create(
				makeAppointment({
					title: "Target",
					startDate: "2026-03-01T08:00:00.000Z",
					endDate: "2026-03-01T09:00:00.000Z",
				}),
			);

			await repository.create(
				makeAppointment({
					title: "Weekly session",
					startDate: "2026-03-01T10:00:00.000Z",
					endDate: "2026-03-01T11:00:00.000Z",
					recurrence: "weekly",
				}),
			);

			expect(target.isOk()).toBe(true);

			if (target.isOk()) {
				const result = await service.updateAppointment(target.value.id, {
					startDate: "2026-03-08T10:10:00.000Z",
					endDate: "2026-03-08T10:50:00.000Z",
				});

				expect(result.isErr()).toBe(true);

				if (result.isErr()) {
					expect(result.error).toBeInstanceOf(ValidationError);
					expect(result.error.message).toBe(
						"Professional has scheduling conflict for the selected period",
					);
				}
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

	describe("AppointmentEventService", () => {
		it("should create completed appointment event", async () => {
			const created = await repository.create(makeAppointment());

			expect(created.isOk()).toBe(true);

			if (created.isOk()) {
				const result = await eventService.createAppointmentEvent(
					created.value.id,
					{
						status: "completed",
						actualStartDate: "2026-03-01T10:05:00.000Z",
						actualEndDate: "2026-03-01T11:05:00.000Z",
						performedByClientId: BASE_CLIENT_ID,
					},
				);

				expect(result.isOk()).toBe(true);

				if (result.isOk()) {
					expect(result.value.appointmentId).toBe(created.value.id);
					expect(result.value.status).toBe("completed");
					expect(result.value.performedByClientId).toBe(BASE_CLIENT_ID);
				}
			}
		});

		it("should fail when creating completed event without professional", async () => {
			const created = await repository.create(makeAppointment());

			expect(created.isOk()).toBe(true);

			if (created.isOk()) {
				const result = await eventService.createAppointmentEvent(
					created.value.id,
					{
						status: "completed",
						actualStartDate: "2026-03-01T10:00:00.000Z",
						actualEndDate: "2026-03-01T11:00:00.000Z",
					},
				);

				expect(result.isErr()).toBe(true);

				if (result.isErr()) {
					expect(result.error).toBeInstanceOf(ValidationError);
				}
			}
		});

		it("should fetch appointment events by appointment id", async () => {
			const created = await repository.create(makeAppointment());

			expect(created.isOk()).toBe(true);

			if (created.isOk()) {
				await eventService.createAppointmentEvent(created.value.id, {
					status: "cancelled",
				});

				const result = await eventService.getAppointmentEventsByAppointmentId(
					created.value.id,
				);

				expect(result.isOk()).toBe(true);

				if (result.isOk()) {
					expect(result.value).toHaveLength(1);
					expect(result.value[0].status).toBe("cancelled");
				}
			}
		});
	});
});
