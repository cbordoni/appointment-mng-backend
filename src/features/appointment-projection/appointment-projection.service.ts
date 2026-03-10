import { err, ok } from "neverthrow";
import { rrulestr } from "rrule";

import { ValidationError } from "@/common/errors";
import { logger } from "@/common/logger";

import type { IAppointmentProjectionRepository } from "./appointment-projection.repository.interface";
import type {
	AppointmentProjectionItem,
	AppointmentProjectionRow,
} from "./appointment-projection.types";

export class AppointmentProjectionService {
	constructor(private readonly repository: IAppointmentProjectionRepository) {}

	private validateRange(from: string, to: string) {
		const start = new Date(from);
		const end = new Date(to);

		if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
			return err(new ValidationError("Invalid date range"));
		}

		if (start >= end) {
			return err(new ValidationError("from must be before to"));
		}

		return ok({ from: start, to: end });
	}

	private toRRuleDateTime(date: Date): string {
		const year = date.getUTCFullYear();
		const month = String(date.getUTCMonth() + 1).padStart(2, "0");
		const day = String(date.getUTCDate()).padStart(2, "0");
		const hours = String(date.getUTCHours()).padStart(2, "0");
		const minutes = String(date.getUTCMinutes()).padStart(2, "0");
		const seconds = String(date.getUTCSeconds()).padStart(2, "0");

		return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
	}

	private resolveOccurrences(
		row: AppointmentProjectionRow,
		from: Date,
		to: Date,
	): AppointmentProjectionItem[] {
		const appointment = row.appointment;
		const duration =
			appointment.dtend.getTime() - appointment.dtstart.getTime();
		const exdateSet = new Set(row.exdates.map((exdate) => exdate.getTime()));
		const overrideByRecurrence = new Map(
			row.overrides.map((override) => [
				override.recurrenceId.getTime(),
				override,
			]),
		);

		const baseStarts = (() => {
			if (!appointment.rrule) {
				const intersectsRange =
					appointment.dtstart < to && appointment.dtend > from;

				return intersectsRange ? [appointment.dtstart] : [];
			}

			const parsedRule = rrulestr(
				`DTSTART:${this.toRRuleDateTime(appointment.dtstart)}\nRRULE:${appointment.rrule}`,
			);

			return parsedRule.between(from, to, true);
		})();

		const projected: AppointmentProjectionItem[] = [];

		for (const baseStart of baseStarts) {
			const recurrenceKey = baseStart.getTime();
			const override = overrideByRecurrence.get(recurrenceKey);

			if (override) {
				if (override.status === "CANCELLED") {
					continue;
				}

				const occurrenceStart = override.dtstart ?? baseStart;
				const occurrenceEnd =
					override.dtend ?? new Date(occurrenceStart.getTime() + duration);

				if (occurrenceStart >= to || occurrenceEnd <= from) {
					continue;
				}

				projected.push({
					appointmentId: appointment.id,
					uid: appointment.uid,
					clientId: appointment.clientId,
					clientName: appointment.clientName,
					professionalId: override.professionalId ?? appointment.professionalId,
					professionalName: appointment.professionalName,
					summary: override.summary ?? appointment.summary,
					description: override.description ?? appointment.description,
					status: (override.status ?? appointment.status) as
						| "TENTATIVE"
						| "CONFIRMED"
						| "CANCELLED",
					dtstart: occurrenceStart,
					dtend: occurrenceEnd,
					timezone: appointment.timezone,
					recurrenceId: baseStart,
					source: "OVERRIDE",
				});

				continue;
			}

			if (exdateSet.has(recurrenceKey)) {
				continue;
			}

			projected.push({
				appointmentId: appointment.id,
				uid: appointment.uid,
				clientId: appointment.clientId,
				clientName: appointment.clientName,
				professionalId: appointment.professionalId,
				professionalName: appointment.professionalName,
				summary: appointment.summary,
				description: appointment.description,
				status: appointment.status as "TENTATIVE" | "CONFIRMED" | "CANCELLED",
				dtstart: baseStart,
				dtend: new Date(baseStart.getTime() + duration),
				timezone: appointment.timezone,
				recurrenceId: appointment.rrule ? baseStart : null,
				source: "APPOINTMENT",
			});
		}

		return projected;
	}

	async getByRange(from: string, to: string) {
		const rangeValidation = this.validateRange(from, to);

		if (rangeValidation.isErr()) {
			return err(rangeValidation.error);
		}

		const range = rangeValidation.value;

		logger.debug("Projecting appointments by range", range);

		const contextResult = await this.repository.findProjectionContext(
			range.from,
			range.to,
		);

		if (contextResult.isErr()) {
			return err(contextResult.error);
		}

		const items = contextResult.value
			.flatMap((row) => this.resolveOccurrences(row, range.from, range.to))
			.sort((left, right) => left.dtstart.getTime() - right.dtstart.getTime());

		logger.info("Appointment projection generated", { count: items.length });

		return ok(items);
	}
}
