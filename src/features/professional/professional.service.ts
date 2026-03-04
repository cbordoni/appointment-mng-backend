import { err, ok, type Result } from "neverthrow";

import {
	type DatabaseError,
	type NotFoundError,
	ValidationError,
} from "@/common/errors";
import { toPaginated } from "@/common/http/to-paginated";
import { logger } from "@/common/logger";
import type { PaginatedResponse } from "@/common/types";
import type { Professional } from "@/db/schema";

import type { IProfessionalRepository } from "./professional.repository.interface";
import type {
	CreateProfessionalInput,
	UpdateProfessionalInput,
} from "./professional.types";

export class ProfessionalService {
	constructor(private readonly repository: IProfessionalRepository) {}

	private validateName(name: string): Result<void, ValidationError> {
		return name.trim().length === 0
			? err(new ValidationError("Name cannot be empty"))
			: ok(undefined);
	}

	private validatePhone(cellphone: string): Result<void, ValidationError> {
		return cellphone.replace(/\D/g, "").length < 10
			? err(new ValidationError("Invalid cellphone number"))
			: ok(undefined);
	}

	private validateTaxId(taxId: string): Result<void, ValidationError> {
		const digits = taxId.replace(/\D/g, "");

		return digits.length === 11 || digits.length === 14
			? ok(undefined)
			: err(new ValidationError("Invalid tax id"));
	}

	async getAllProfessionals(
		page = 1,
		limit = 10,
	): Promise<Result<PaginatedResponse<Professional>, DatabaseError>> {
		logger.debug("Fetching all professionals", { page, limit });

		const getResult = await this.repository.findAll(page, limit);

		return getResult.map((data) => {
			logger.info("Professionals fetched successfully", {
				count: data.items.length,
				total: data.total,
				page,
			});

			return toPaginated(data, page, limit);
		});
	}

	async getProfessionalById(
		id: string,
	): Promise<Result<Professional, NotFoundError | DatabaseError>> {
		logger.debug("Fetching professional by id", { id });

		const result = await this.repository.findById(id);

		result.match(
			() => logger.info("Professional fetched successfully", { id }),
			() => logger.warn("Professional not found", { id }),
		);

		return result;
	}

	async createProfessional(
		data: CreateProfessionalInput,
	): Promise<Result<Professional, ValidationError | DatabaseError>> {
		logger.debug("Creating professional", { name: data.name });

		const validationResult = this.validateName(data.name)
			.andThen(() => this.validateTaxId(data.taxId))
			.andThen(() => this.validatePhone(data.cellphone));

		if (validationResult.isErr()) {
			logger.warn("Professional creation failed: invalid input", {
				reason: validationResult.error.message,
			});
			return err(validationResult.error);
		}

		const createResult = await this.repository.create(data);

		return createResult.map((professional) => {
			logger.info("Professional created successfully", {
				id: professional.id,
				name: professional.name,
			});

			return professional;
		});
	}

	async updateProfessional(
		id: string,
		data: UpdateProfessionalInput,
	): Promise<
		Result<Professional, ValidationError | NotFoundError | DatabaseError>
	> {
		logger.debug("Updating professional", { id, fields: Object.keys(data) });

		const nameValidationResult =
			data.name !== undefined ? this.validateName(data.name) : ok(undefined);

		const taxIdValidationResult =
			data.taxId !== undefined ? this.validateTaxId(data.taxId) : ok(undefined);

		const phoneValidationResult =
			data.cellphone !== undefined
				? this.validatePhone(data.cellphone)
				: ok(undefined);

		const validationResult = nameValidationResult
			.andThen(() => taxIdValidationResult)
			.andThen(() => phoneValidationResult);

		if (validationResult.isErr()) {
			logger.warn("Professional update failed: invalid input", { id });
			return err(validationResult.error);
		}

		const updateResult = await this.repository.update(id, data);

		return updateResult.map((professional) => {
			logger.info("Professional updated successfully", { id });
			return professional;
		});
	}

	async deleteProfessional(
		id: string,
	): Promise<Result<void, NotFoundError | DatabaseError>> {
		logger.debug("Deleting professional", { id });

		const deleteResult = await this.repository.delete(id);

		return deleteResult.map(() => {
			logger.info("Professional deleted successfully", { id });
			return undefined;
		});
	}
}
