import { beforeEach, describe, expect, it } from "bun:test";
import { ok } from "neverthrow";

import { ValidationError } from "@/common/errors";
import type { IScheduler } from "@/features/scheduler/scheduler.interface";

import { MockAppointmentRepository } from "./appointment.repository.mock";
import { AppointmentService } from "./appointment.service";
import type { CreateAppointmentInput } from "./appointment.types";

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
	let notificationScheduler: MockAppointmentNotificationScheduler;

	beforeEach(() => {
		repository = new MockAppointmentRepository();
		notificationScheduler = new MockAppointmentNotificationScheduler();
		service = new AppointmentService(repository, notificationScheduler);
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
	});

	describe("createAppointment", () => {
		it("should create appointment with valid data", async () => {
			const result = await service.createAppointment(makeAppointment());

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value.id).toBeDefined();
				expect(notificationScheduler.scheduledAppointmentIds).toEqual([
					result.value.id,
				]);
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
			}
		});
	});
});
