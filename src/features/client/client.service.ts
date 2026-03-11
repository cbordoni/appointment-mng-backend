import { err, ok, type Result } from "neverthrow";

import {
	type DatabaseError,
	type NotFoundError,
	ValidationError,
} from "@/common/errors";
import { toPaginated } from "@/common/http/to-paginated";
import { logger } from "@/common/logger";
import type { PaginatedResponse } from "@/common/types";
import type { Client } from "@/db/schema";

import type { IStoreRepository } from "../store/store.repository.interface";
import type { IClientRepository } from "./client.repository.interface";
import type { CreateClientInput, UpdateClientInput } from "./client.types";

export class ClientService {
	constructor(
		private readonly repository: IClientRepository,
		private readonly storeRepository: IStoreRepository,
	) {}

	private validateName(name: string): Result<void, ValidationError> {
		return name.trim().length === 0
			? err(new ValidationError("Name cannot be empty"))
			: ok(undefined);
	}

	private validateCellphone(cellphone: string): Result<void, ValidationError> {
		return cellphone.replace(/\D/g, "").length < 10
			? err(new ValidationError("Invalid cellphone number"))
			: ok(undefined);
	}

	private async validateStoreExists(
		storeId: string,
	): Promise<Result<void, ValidationError | DatabaseError>> {
		const storeExistsResult = await this.storeRepository.exists(storeId);

		return storeExistsResult.andThen((exists) => {
			if (!exists) {
				return err(new ValidationError("Store not found"));
			}

			return ok(undefined);
		});
	}

	async getAllClients(
		page = 1,
		limit = 10,
		storeId: string,
	): Promise<Result<PaginatedResponse<Client>, DatabaseError>> {
		logger.debug("Fetching all clients", { page, limit, storeId });

		const getResult = await this.repository.findAll(page, limit, storeId);

		return getResult.map((data) => {
			logger.info("Clients fetched successfully", {
				count: data.items.length,
				total: data.total,
				page,
				storeId,
			});

			return toPaginated(data, page, limit);
		});
	}

	async getClientById(
		id: string,
	): Promise<Result<Client, NotFoundError | DatabaseError>> {
		logger.debug("Fetching client by id", { id });

		const result = await this.repository.findById(id);

		result.match(
			() => logger.info("Client fetched successfully", { id }),
			() => logger.warn("Client not found", { id }),
		);

		return result;
	}

	async createClient(
		data: CreateClientInput,
	): Promise<Result<Client, ValidationError | DatabaseError>> {
		logger.debug("Creating client", { name: data.name });

		const validationResult = this.validateName(data.name)
			//
			.andThen(() => this.validateCellphone(data.cellphone));

		if (validationResult.isErr()) {
			logger.warn("Client creation failed: invalid input", {
				reason: validationResult.error.message,
			});

			return err(validationResult.error);
		}

		const storeValidationResult = await this.validateStoreExists(data.storeId);

		if (storeValidationResult.isErr()) {
			logger.warn("Client creation failed: invalid store", {
				storeId: data.storeId,
				reason: storeValidationResult.error.message,
			});

			return err(storeValidationResult.error);
		}

		const createResult = await this.repository.create(data);

		return createResult.map((client) => {
			logger.info("Client created successfully", {
				id: client.id,
				name: client.name,
			});

			return client;
		});
	}

	async updateClient(
		id: string,
		data: UpdateClientInput,
	): Promise<Result<Client, ValidationError | NotFoundError | DatabaseError>> {
		logger.debug("Updating client", { id, fields: Object.keys(data) });

		const nameValidationResult =
			data.name !== undefined ? this.validateName(data.name) : ok(undefined);

		const cellphoneValidationResult =
			data.cellphone !== undefined
				? this.validateCellphone(data.cellphone)
				: ok(undefined);

		const validationResult = nameValidationResult
			// Validate cellphone only if name is valid (if provided)
			.andThen(() => cellphoneValidationResult);

		if (validationResult.isErr()) {
			logger.warn("Client update failed: invalid input", { id });
			return err(validationResult.error);
		}

		const updateResult = await this.repository.update(id, data);

		return updateResult.map((client) => {
			logger.info("Client updated successfully", { id });
			return client;
		});
	}

	async deleteClient(
		id: string,
	): Promise<Result<void, NotFoundError | DatabaseError>> {
		logger.debug("Deleting client", { id });

		const deleteResult = await this.repository.delete(id);

		return deleteResult.map(() => {
			logger.info("Client deleted successfully", { id });
			return undefined;
		});
	}
}
