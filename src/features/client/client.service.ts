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

import type { IAccountRepository } from "../account/account.repository.interface";
import type {
	ClientListItem,
	IClientRepository,
} from "./client.repository.interface";
import type { CreateClientInput } from "./client.types";

export class ClientService {
	constructor(
		private readonly repository: IClientRepository,
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

	async getAllClients(
		page = 1,
		limit = 10,
		storeId: string,
	): Promise<Result<PaginatedResponse<ClientListItem>, DatabaseError>> {
		logger.debug("Fetching all clients", { page, limit });

		const getResult = await this.repository.findAll(page, limit, storeId);

		return getResult.map((data) => {
			logger.info("Clients fetched successfully", {
				count: data.items.length,
				total: data.total,
				page,
			});

			return toPaginated(data, page, limit);
		});
	}

	async createClient(
		data: CreateClientInput,
	): Promise<Result<Client, ValidationError | DatabaseError>> {
		logger.debug("Creating client", { accountId: data.accountId });

		const accountValidationResult = await this.validateAccountExists(
			data.accountId,
		);

		if (accountValidationResult.isErr()) {
			logger.warn("Client creation failed: invalid account", {
				accountId: data.accountId,
				reason: accountValidationResult.error.message,
			});

			return err(accountValidationResult.error);
		}

		const createResult = await this.repository.create(data);

		return createResult.map((client) => {
			logger.info("Client created successfully", {
				id: client.id,
				accountId: client.accountId,
			});

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
