import { beforeEach, describe, expect, it } from "bun:test";
import { ok } from "neverthrow";
import { rrulestr } from "rrule";

import { ValidationError } from "@/common/errors";
import type { Appointment } from "@/db/schema";

import type { IAppointmentProjectionRepository } from "./appointment-projection.repository.interface";
import { AppointmentProjectionService } from "./appointment-projection.service";
import type { AppointmentProjectionRow } from "./appointment-projection.types";

class MockAppointmentProjectionRepository
	implements IAppointmentProjectionRepository
{
	private rows: AppointmentProjectionRow[] = [];

	public requestedFrom: Date | null = null;
	public requestedTo: Date | null = null;

	async findProjectionContext(from: Date, to: Date) {
		this.requestedFrom = from;
		this.requestedTo = to;

		return ok(this.rows);
	}

	setRows(rows: AppointmentProjectionRow[]) {
		this.rows = rows;
	}
}

const makeAppointment = (
	overrides: Partial<Appointment> = {},
): Appointment & { clientName: string; professionalName: string } => ({
	id: "00000000-0000-0000-0000-000000000101",
	uid: "appointment-101@appointment.local",
	summary: "Consulta",
	description: "Retorno",
	dtStart: new Date("2026-03-10T10:00:00.000Z"),
	dtEnd: new Date("2026-03-10T11:00:00.000Z"),
	timezone: "UTC",
	rrule: null,
	status: "CONFIRMED",
	sequence: 0,
	dtstamp: new Date("2026-03-10T09:00:00.000Z"),
	deletedAt: null,
	clientId: "00000000-0000-0000-0000-000000000001",
	professionalId: "00000000-0000-0000-0000-000000000010",
	createdAt: new Date("2026-03-01T00:00:00.000Z"),
	updatedAt: new Date("2026-03-01T00:00:00.000Z"),
	clientName: "Maria",
	professionalName: "Dr. Silva",
	...overrides,
});

const getRecurringStarts = (
	appointment: Appointment,
	fromIso: string,
	toIso: string,
) => {
	if (!appointment.rrule) {
		return [appointment.dtStart];
	}

	const dtStart = appointment.dtStart
		.toISOString()
		.replace(/[-:]/g, "")
		.replace(".000", "");

	const parsedRule = rrulestr(
		`DTSTART:${dtStart}\nRRULE:${appointment.rrule}`,
	);

	return parsedRule.between(new Date(fromIso), new Date(toIso), true);
};

describe("AppointmentProjectionService", () => {
	let repository: MockAppointmentProjectionRepository;
	let service: AppointmentProjectionService;

	beforeEach(() => {
		repository = new MockAppointmentProjectionRepository();
		service = new AppointmentProjectionService(repository);
	});

	describe("getByRange", () => {
		it("should fail when date range is invalid", async () => {
			const result = await service.getByRange(
				"2026-03-10T10:00:00.000Z",
				"2026-03-10T10:00:00.000Z",
			);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("from must be before to");
			}
		});

		it("should project a non recurring appointment inside range", async () => {
			repository.setRows([
				{
					appointment: makeAppointment(),
					exdates: [],
					overrides: [],
				},
			]);

			const result = await service.getByRange(
				"2026-03-10T00:00:00.000Z",
				"2026-03-11T00:00:00.000Z",
			);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value).toHaveLength(1);
				expect(result.value[0].source).toBe("APPOINTMENT");
				expect(result.value[0].recurrenceId).toBeNull();
			}

			expect(repository.requestedFrom?.toISOString()).toBe(
				"2026-03-10T00:00:00.000Z",
			);
			expect(repository.requestedTo?.toISOString()).toBe(
				"2026-03-11T00:00:00.000Z",
			);
		});

		it("should apply exdate and override for recurring appointments", async () => {
			const appointment = makeAppointment({
				rrule: "FREQ=DAILY;COUNT=3",
			});

			const recurrenceStarts = getRecurringStarts(
				appointment,
				"2026-03-10T00:00:00.000Z",
				"2026-03-13T00:00:00.000Z",
			);

			repository.setRows([
				{
					appointment,
					exdates: [recurrenceStarts[1]],
					overrides: [
						{
							recurrenceId: recurrenceStarts[2],
							summary: "Consulta ajustada",
							description: "Mudança de horário",
							dtStart: new Date("2026-03-12T12:00:00.000Z"),
							dtEnd: new Date("2026-03-12T13:00:00.000Z"),
							status: "CONFIRMED",
							professionalId: "00000000-0000-0000-0000-000000000011",
						},
					],
				},
			]);

			const result = await service.getByRange(
				"2026-03-10T00:00:00.000Z",
				"2026-03-13T00:00:00.000Z",
			);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value).toHaveLength(2);

				expect(result.value[0].dtStart.toISOString()).toBe(
					"2026-03-10T10:00:00.000Z",
				);
				expect(result.value[0].source).toBe("APPOINTMENT");

				expect(result.value[1].dtStart.toISOString()).toBe(
					"2026-03-12T12:00:00.000Z",
				);
				expect(result.value[1].source).toBe("OVERRIDE");
				expect(result.value[1].summary).toBe("Consulta ajustada");
				expect(result.value[1].professionalId).toBe(
					"00000000-0000-0000-0000-000000000011",
				);
			}
		});

		it("should skip recurring occurrence when override is cancelled", async () => {
			const appointment = makeAppointment({
				rrule: "FREQ=DAILY;COUNT=2",
			});

			const recurrenceStarts = getRecurringStarts(
				appointment,
				"2026-03-10T00:00:00.000Z",
				"2026-03-12T00:00:00.000Z",
			);

			repository.setRows([
				{
					appointment,
					exdates: [],
					overrides: [
						{
							recurrenceId: recurrenceStarts[1],
							summary: null,
							description: null,
							dtStart: null,
							dtEnd: null,
							status: "CANCELLED",
							professionalId: null,
						},
					],
				},
			]);

			const result = await service.getByRange(
				"2026-03-10T00:00:00.000Z",
				"2026-03-12T00:00:00.000Z",
			);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value).toHaveLength(1);
				expect(result.value[0].dtStart.toISOString()).toBe(
					"2026-03-10T10:00:00.000Z",
				);
			}
		});
	});
});
