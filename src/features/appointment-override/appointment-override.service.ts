import { err, ok } from "neverthrow";

import { ValidationError } from "@/common/errors";
import { toPaginated } from "@/common/http/to-paginated";
import { logger } from "@/common/logger";

import type { IAppointmentOverrideRepository } from "./appointment-override.repository.interface";
import type {
	CreateAppointmentOverrideInput,
	UpdateAppointmentOverrideInput,
} from "./appointment-override.types";

export class AppointmentOverrideService {
	constructor(private readonly repository: IAppointmentOverrideRepository) {}

	private validateDateTime(value: string, fieldName: string) {
		return Number.isNaN(new Date(value).getTime())
			? err(new ValidationError(`Invalid ${fieldName}`))
			: ok(undefined);
	}

	async getAll(page = 1, limit = 10) {
		logger.debug("Fetching appointment overrides", { page, limit });

		const result = await this.repository.findAll(page, limit);

		return result.map((data) => toPaginated(data, page, limit));
	}

	async getById(id: string) {
		logger.debug("Fetching appointment override by id", { id });

		return await this.repository.findById(id);
	}

	async create(data: CreateAppointmentOverrideInput) {
		const recurrenceValidation = this.validateDateTime(
			data.recurrenceId,
			"recurrenceId",
		);

		if (recurrenceValidation.isErr()) {
			return err(recurrenceValidation.error);
		}

		if (data.dtstart !== undefined && data.dtstart !== null) {
			const dtstartValidation = this.validateDateTime(data.dtstart, "dtstart");

			if (dtstartValidation.isErr()) {
				return err(dtstartValidation.error);
			}
		}

		if (data.dtend !== undefined && data.dtend !== null) {
			const dtendValidation = this.validateDateTime(data.dtend, "dtend");

			if (dtendValidation.isErr()) {
				return err(dtendValidation.error);
			}
		}

		if (data.dtstamp !== undefined) {
			const dtstampValidation = this.validateDateTime(data.dtstamp, "dtstamp");

			if (dtstampValidation.isErr()) {
				return err(dtstampValidation.error);
			}
		}

		logger.debug("Creating appointment override", {
			appointmentId: data.appointmentId,
		});

		return await this.repository.create(data);
	}

	async update(id: string, data: UpdateAppointmentOverrideInput) {
		if (data.recurrenceId !== undefined) {
			const recurrenceValidation = this.validateDateTime(
				data.recurrenceId,
				"recurrenceId",
			);

			if (recurrenceValidation.isErr()) {
				return err(recurrenceValidation.error);
			}
		}

		if (data.dtstart !== undefined && data.dtstart !== null) {
			const dtstartValidation = this.validateDateTime(data.dtstart, "dtstart");

			if (dtstartValidation.isErr()) {
				return err(dtstartValidation.error);
			}
		}

		if (data.dtend !== undefined && data.dtend !== null) {
			const dtendValidation = this.validateDateTime(data.dtend, "dtend");

			if (dtendValidation.isErr()) {
				return err(dtendValidation.error);
			}
		}

		if (data.dtstamp !== undefined) {
			const dtstampValidation = this.validateDateTime(data.dtstamp, "dtstamp");

			if (dtstampValidation.isErr()) {
				return err(dtstampValidation.error);
			}
		}

		logger.debug("Updating appointment override", { id });

		return await this.repository.update(id, data);
	}

	async delete(id: string) {
		logger.debug("Deleting appointment override", { id });

		const result = await this.repository.delete(id);

		return result.map(() => undefined);
	}
}
