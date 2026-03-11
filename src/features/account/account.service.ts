import { err, ok, type Result } from "neverthrow";

import {
	type DatabaseError,
	type NotFoundError,
	ValidationError,
} from "@/common/errors";
import { toPaginated } from "@/common/http/to-paginated";
import { logger } from "@/common/logger";
import type { PaginatedResponse } from "@/common/types";
import type { Account } from "@/db/schema";

import type { IStoreRepository } from "../store/store.repository.interface";
import type { IAccountRepository } from "./account.repository.interface";
import type { CreateAccountInput, UpdateAccountInput } from "./account.types";

export class AccountService {
	constructor(
		private readonly repository: IAccountRepository,
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

	private async hashPassword(password: string): Promise<string> {
		return Bun.password.hash(password);
	}

	async getAllAccounts(
		page = 1,
		limit = 10,
		storeId: string,
	): Promise<Result<PaginatedResponse<Account>, DatabaseError>> {
		logger.debug("Fetching all accounts", { page, limit, storeId });

		const getResult = await this.repository.findAll(page, limit, storeId);

		return getResult.map((data) => {
			logger.info("Accounts fetched successfully", {
				count: data.items.length,
				total: data.total,
				page,
				storeId,
			});

			return toPaginated(data, page, limit);
		});
	}

	async getAccountById(
		id: string,
	): Promise<Result<Account, NotFoundError | DatabaseError>> {
		logger.debug("Fetching account by id", { id });

		const result = await this.repository.findById(id);

		result.match(
			() => logger.info("Account fetched successfully", { id }),
			() => logger.warn("Account not found", { id }),
		);

		return result;
	}

	async createAccount(
		data: CreateAccountInput,
	): Promise<Result<Account, ValidationError | DatabaseError>> {
		logger.debug("Creating account", { name: data.name });

		const validationResult = this.validateName(data.name)
			//
			.andThen(() => this.validateCellphone(data.cellphone));

		if (validationResult.isErr()) {
			logger.warn("Account creation failed: invalid input", {
				reason: validationResult.error.message,
			});

			return err(validationResult.error);
		}

		const storeValidationResult = await this.validateStoreExists(data.storeId);

		if (storeValidationResult.isErr()) {
			logger.warn("Account creation failed: invalid store", {
				storeId: data.storeId,
				reason: storeValidationResult.error.message,
			});

			return err(storeValidationResult.error);
		}

		const passwordHash = await this.hashPassword(data.password);
		const { password: _password, ...rest } = data;

		const createResult = await this.repository.create({
			...rest,
			passwordHash,
		});

		return createResult.map((account) => {
			logger.info("Account created successfully", {
				id: account.id,
				name: account.name,
			});

			return account;
		});
	}

	async updateAccount(
		id: string,
		data: UpdateAccountInput,
	): Promise<Result<Account, ValidationError | NotFoundError | DatabaseError>> {
		logger.debug("Updating account", { id, fields: Object.keys(data) });

		const nameValidationResult =
			data.name !== undefined ? this.validateName(data.name) : ok(undefined);

		const cellphoneValidationResult =
			data.cellphone !== undefined
				? this.validateCellphone(data.cellphone)
				: ok(undefined);

		const validationResult = nameValidationResult
			//
			.andThen(() => cellphoneValidationResult);

		if (validationResult.isErr()) {
			logger.warn("Account update failed: invalid input", { id });

			return err(validationResult.error);
		}

		const { password: _password, ...rest } = data;

		const updatePayload =
			data.password !== undefined
				? { ...rest, passwordHash: await this.hashPassword(data.password) }
				: rest;

		const updateResult = await this.repository.update(id, updatePayload);

		return updateResult.map((account) => {
			logger.info("Account updated successfully", { id });

			return account;
		});
	}

	async deleteAccount(
		id: string,
	): Promise<Result<void, NotFoundError | DatabaseError>> {
		logger.debug("Deleting account", { id });

		const deleteResult = await this.repository.delete(id);

		return deleteResult.map(() => {
			logger.info("Account deleted successfully", { id });

			return undefined;
		});
	}
}
