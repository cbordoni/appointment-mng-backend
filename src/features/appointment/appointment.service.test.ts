import { beforeEach, describe, expect, it } from "bun:test";
import { ok } from "neverthrow";

import { ValidationError } from "@/common/errors";
import type { IScheduler } from "@/features/scheduler/scheduler.interface";

import { MockAppointmentRepository } from "./appointment.repository.mock";
import { AppointmentService } from "./appointment.service";
import type { CreateAppointmentInput } from "./appointment.types";

const BASE_CLIENT_ID = "00000000-0000-0000-0000-000000000001";
const BASE_PROFESSIONAL_ID = "00000000-0000-0000-0000-000000000010";
const BASE_STORE_ID = "00000000-0000-0000-0000-000000000100";
const OTHER_CLIENT_ID = "00000000-0000-0000-0000-000000000002";
const OTHER_PROFESSIONAL_ID = "00000000-0000-0000-0000-000000000020";
const OTHER_STORE_ID = "00000000-0000-0000-0000-000000000200";

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
	summary: "Therapy Session",
	dtStart: "2026-03-01T10:00:00.000Z",
	dtEnd: "2026-03-01T11:00:00.000Z",
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
		repository.setClientsMap(
			new Map([
				[BASE_CLIENT_ID, "John Doe"],
				[OTHER_CLIENT_ID, "Jane Doe"],
			]),
		);
		repository.setClientStoreMap(
			new Map([
				[BASE_CLIENT_ID, BASE_STORE_ID],
				[OTHER_CLIENT_ID, OTHER_STORE_ID],
			]),
		);
		repository.setProfessionalsMap(
			new Map([
				[BASE_PROFESSIONAL_ID, "Dr. Alice Smith"],
				[OTHER_PROFESSIONAL_ID, "Dr. Bob Stone"],
			]),
		);
		repository.setProfessionalStoreMap(
			new Map([
				[BASE_PROFESSIONAL_ID, BASE_STORE_ID],
				[OTHER_PROFESSIONAL_ID, OTHER_STORE_ID],
			]),
		);
	});

	describe("getAllAppointments", () => {
		it("should return all appointments when no filter is provided", async () => {
			await repository.create(makeAppointment());
			await repository.create(makeAppointment({ summary: "Second Session" }));

			const result = await service.getAllAppointments({
				storeId: BASE_STORE_ID,
			});

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value).toHaveLength(2);
				expect(result.value[0].clientName).toBe("John Doe");
				expect(result.value[0].professionalName).toBe("Dr. Alice Smith");
			}
		});

		it("should return only appointments from requested store", async () => {
			await repository.create(makeAppointment());
			await repository.create(
				makeAppointment({
					summary: "Other Store Session",
					clientId: OTHER_CLIENT_ID,
					professionalId: OTHER_PROFESSIONAL_ID,
				}),
			);

			const result = await service.getAllAppointments({
				storeId: BASE_STORE_ID,
			});

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value).toHaveLength(1);
				expect(result.value[0]?.summary).toBe("Therapy Session");
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

		it("should fail when summary is empty", async () => {
			const result = await service.createAppointment(
				makeAppointment({ summary: "   " }),
			);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Summary cannot be empty");
			}
		});

		it("should fail when rrule is invalid", async () => {
			const result = await service.createAppointment(
				makeAppointment({ rrule: "INVALID=RULE" }),
			);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe(
					"Invalid rrule. Expected RFC 5545 RRULE format",
				);
			}
		});

		it("should fail when professional has conflict in appointments", async () => {
			await repository.create(
				makeAppointment({
					dtStart: "2026-03-01T10:00:00.000Z",
					dtEnd: "2026-03-01T11:00:00.000Z",
				}),
			);

			const result = await service.createAppointment(
				makeAppointment({
					dtStart: "2026-03-01T10:30:00.000Z",
					dtEnd: "2026-03-01T11:30:00.000Z",
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
					summary: "Updated Session",
				});

				expect(result.isOk()).toBe(true);

				if (result.isOk()) {
					expect(result.value.summary).toBe("Updated Session");
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
