import { err, ok } from "neverthrow";

import { ValidationError } from "@/common/errors";
import { toPaginated } from "@/common/http/to-paginated";
import { logger } from "@/common/logger";

import type { IAppointmentExceptionRepository } from "./appointment-exception.repository.interface";
import type {
	CreateAppointmentExceptionInput,
	UpdateAppointmentExceptionInput,
} from "./appointment-exception.types";

export class AppointmentExceptionService {
	constructor(private readonly repository: IAppointmentExceptionRepository) {}

	private validateExdate(exdate: string) {
		return Number.isNaN(new Date(exdate).getTime())
			? err(new ValidationError("Invalid exdate"))
			: ok(undefined);
	}

	async getAll(page = 1, limit = 10) {
		logger.debug("Fetching appointment exceptions", { page, limit });

		const result = await this.repository.findAll(page, limit);

		return result.map((data) => toPaginated(data, page, limit));
	}

	async getById(id: string) {
		logger.debug("Fetching appointment exception by id", { id });

		return await this.repository.findById(id);
	}

	async create(data: CreateAppointmentExceptionInput) {
		const validationResult = this.validateExdate(data.exdate);

		if (validationResult.isErr()) {
			return err(validationResult.error);
		}

		logger.debug("Creating appointment exception", {
			appointmentId: data.appointmentId,
		});

		return await this.repository.create(data);
	}

	async update(id: string, data: UpdateAppointmentExceptionInput) {
		if (data.exdate !== undefined) {
			const validationResult = this.validateExdate(data.exdate);

			if (validationResult.isErr()) {
				return err(validationResult.error);
			}
		}

		logger.debug("Updating appointment exception", { id });

		return await this.repository.update(id, data);
	}

	async delete(id: string) {
		logger.debug("Deleting appointment exception", { id });

		const result = await this.repository.delete(id);

		return result.map(() => undefined);
	}
}
