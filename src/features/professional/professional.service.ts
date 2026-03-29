import { err, ok, type Result } from "neverthrow";

import {
	type DatabaseError,
	type NotFoundError,
	ValidationError,
} from "@/common/errors";
import { toPaginated } from "@/common/http/to-paginated";
import { logger } from "@/common/logger";
import type { PaginatedResponse } from "@/common/types";
import type { AsyncDomainResult } from "@/common/types/database-result";
import type { Professional } from "@/db/schema";
import type { IAccountRepository } from "../account/account.repository.interface";
import type { IProfessionalRepository } from "./professional.repository.interface";
import type {
	CreateProfessionalInput,
	UpdateProfessionalInput,
} from "./professional.types";

export class ProfessionalService {
	constructor(
		private readonly repository: IProfessionalRepository,
		private readonly accountRepository: IAccountRepository,
	) {}

	private async validateAccountExists(
		accountId: string,
	): Promise<Result<void, ValidationError | DatabaseError>> {
		const accountExistsResult = await this.accountRepository.exists(accountId);

		return accountExistsResult.andThen((exists) => {
			if (!exists) {
				return err(new ValidationError("Account not found"));
			}

			return ok(undefined);
		});
	}

	async getAllProfessionals(
		page = 1,
		limit = 10,
		storeId: string,
	): AsyncDomainResult<PaginatedResponse<Partial<Professional>>> {
		logger.debug("Fetching all professionals", { page, limit, storeId });

		const getResult = await this.repository.findAll(page, limit, storeId);

		return getResult.map((data) => {
			logger.info("Professionals fetched successfully", {
				count: data.items.length,
				total: data.total,
				page,
				storeId,
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
		logger.debug("Creating professional", { accountId: data.accountId });

		const accountValidationResult = await this.validateAccountExists(
			data.accountId,
		);

		if (accountValidationResult.isErr()) {
			logger.warn("Professional creation failed: invalid account", {
				accountId: data.accountId,
				reason: accountValidationResult.error.message,
			});

			return err(accountValidationResult.error);
		}

		const createResult = await this.repository.create(data);

		return createResult.map((professional) => {
			logger.info("Professional created successfully", {
				id: professional.id,
				accountId: professional.accountId,
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

		if (data.accountId !== undefined) {
			const accountValidationResult = await this.validateAccountExists(
				data.accountId,
			);

			if (accountValidationResult.isErr()) {
				logger.warn("Professional update failed: invalid account", {
					id,
					accountId: data.accountId,
				});

				return err(accountValidationResult.error);
			}
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
