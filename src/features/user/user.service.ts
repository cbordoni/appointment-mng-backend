import { err, ok, type Result } from "neverthrow";

import {
	type DatabaseError,
	type NotFoundError,
	ValidationError,
} from "@/common/errors";
import { toPaginated } from "@/common/http/to-paginated";
import { logger } from "@/common/logger";
import type { PaginatedResponse } from "@/common/types";
import type { User } from "@/db/schema";

import type { IUserRepository } from "./user.repository.interface";
import type { CreateUserInput, UpdateUserInput } from "./user.types";

export class UserService {
	constructor(private readonly repository: IUserRepository) {}

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

	async getAllUsers(
		page = 1,
		limit = 10,
	): Promise<Result<PaginatedResponse<User>, DatabaseError>> {
		logger.debug("Fetching all users", { page, limit });

		return (await this.repository.findAll(page, limit)).map((data) => {
			logger.info("Users fetched successfully", {
				count: data.items.length,
				total: data.total,
				page,
			});

			return toPaginated(data, page, limit);
		});
	}

	async getUserById(
		id: string,
	): Promise<Result<User, NotFoundError | DatabaseError>> {
		logger.debug("Fetching user by id", { id });

		const result = await this.repository.findById(id);

		result.match(
			() => logger.info("User fetched successfully", { id }),
			() => logger.warn("User not found", { id }),
		);

		return result;
	}

	async createUser(
		data: CreateUserInput,
	): Promise<Result<User, ValidationError | DatabaseError>> {
		logger.debug("Creating user", { email: data.email });

		const validationResult = this.validateName(data.name)
			//
			.andThen(() => this.validateCellphone(data.cellphone));

		if (validationResult.isErr()) {
			logger.warn("User creation failed: invalid input", {
				reason: validationResult.error.message,
			});
			return err(validationResult.error);
		}

		return (await this.repository.create(data)).map((user) => {
			logger.info("User created successfully", {
				id: user.id,
				email: user.email,
			});

			return user;
		});
	}

	async updateUser(
		id: string,
		data: UpdateUserInput,
	): Promise<Result<User, ValidationError | NotFoundError | DatabaseError>> {
		logger.debug("Updating user", { id, fields: Object.keys(data) });

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
			logger.warn("User update failed: invalid input", { id });
			return err(validationResult.error);
		}

		return (await this.repository.update(id, data)).map((user) => {
			logger.info("User updated successfully", { id });
			return user;
		});
	}

	async deleteUser(
		id: string,
	): Promise<Result<void, NotFoundError | DatabaseError>> {
		logger.debug("Deleting user", { id });

		return (await this.repository.delete(id)).map(() => {
			logger.info("User deleted successfully", { id });
			return undefined;
		});
	}
}
