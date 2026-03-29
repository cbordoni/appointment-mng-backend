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
import type { Store } from "@/db/schema";
import type { IStoreRepository } from "./store.repository.interface";
import type { CreateStoreInput, UpdateStoreInput } from "./store.types";

export class StoreService {
	constructor(private readonly repository: IStoreRepository) {}

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

	private validateCnpj(taxId: string): Result<void, ValidationError> {
		const digits = taxId.replace(/\D/g, "");

		return digits.length === 14
			? ok(undefined)
			: err(new ValidationError("Invalid taxId"));
	}

	async getAllStores(
		page = 1,
		limit = 10,
	): AsyncDomainResult<PaginatedResponse<Partial<Store>>> {
		logger.debug("Fetching all stores", { page, limit });

		const getResult = await this.repository.findAll(page, limit);

		return getResult.map((data) => {
			logger.info("Stores fetched successfully", {
				count: data.items.length,
				total: data.total,
				page,
			});

			return toPaginated(data, page, limit);
		});
	}

	async getStoreById(
		id: string,
	): Promise<Result<Store, NotFoundError | DatabaseError>> {
		logger.debug("Fetching store by id", { id });

		const result = await this.repository.findById(id);

		result.match(
			() => logger.info("Store fetched successfully", { id }),
			() => logger.warn("Store not found", { id }),
		);

		return result;
	}

	async createStore(
		data: CreateStoreInput,
	): Promise<Result<Store, ValidationError | DatabaseError>> {
		logger.debug("Creating store", { name: data.name });

		const cnpjValidationResult =
			data.taxId !== undefined ? this.validateCnpj(data.taxId) : ok(undefined);

		const phoneValidationResult =
			data.cellphone !== undefined
				? this.validatePhone(data.cellphone)
				: ok(undefined);

		const validationResult = this.validateName(data.name)
			.andThen(() => cnpjValidationResult)
			.andThen(() => phoneValidationResult);

		if (validationResult.isErr()) {
			logger.warn("Store creation failed: invalid input", {
				reason: validationResult.error.message,
			});

			return err(validationResult.error);
		}

		const createResult = await this.repository.create(data);

		return createResult.map((store) => {
			logger.info("Store created successfully", {
				id: store.id,
				name: store.name,
			});

			return store;
		});
	}

	async updateStore(
		id: string,
		data: UpdateStoreInput,
	): Promise<Result<Store, ValidationError | NotFoundError | DatabaseError>> {
		logger.debug("Updating store", { id, fields: Object.keys(data) });

		const nameValidationResult =
			data.name !== undefined ? this.validateName(data.name) : ok(undefined);

		const taxIdValidationResult =
			data.taxId !== undefined ? this.validateCnpj(data.taxId) : ok(undefined);

		const phoneValidationResult =
			data.cellphone !== undefined
				? this.validatePhone(data.cellphone)
				: ok(undefined);

		const validationResult = nameValidationResult
			.andThen(() => taxIdValidationResult)
			.andThen(() => phoneValidationResult);

		if (validationResult.isErr()) {
			logger.warn("Store update failed: invalid input", { id });

			return err(validationResult.error);
		}

		const updateResult = await this.repository.update(id, data);

		return updateResult.map((store) => {
			logger.info("Store updated successfully", { id });

			return store;
		});
	}

	async deleteStore(
		id: string,
	): Promise<Result<void, NotFoundError | DatabaseError>> {
		logger.debug("Deleting store", { id });

		const deleteResult = await this.repository.delete(id);

		return deleteResult.map(() => {
			logger.info("Store deleted successfully", { id });

			return undefined;
		});
	}
}
