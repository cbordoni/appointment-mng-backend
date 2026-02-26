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
		if (name.trim().length === 0) {
			return err(new ValidationError("Name cannot be empty"));
		}

		return ok(undefined);
	}

	private validateCellphone(cellphone: string): Result<void, ValidationError> {
		if (cellphone.replace(/\D/g, "").length < 10) {
			return err(new ValidationError("Invalid cellphone number"));
		}

		return ok(undefined);
	}

	async getAllUsers(
		page = 1,
		limit = 10,
	): Promise<Result<PaginatedResponse<User>, DatabaseError>> {
		logger.debug("Fetching all users", { page, limit });
		const result = await this.repository.findAll(page, limit);

		return result.map((data) => {
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

		if (result.isOk()) {
			logger.info("User fetched successfully", { id });
		} else {
			logger.warn("User not found", { id });
		}

		return result;
	}

	async createUser(
		data: CreateUserInput,
	): Promise<Result<User, ValidationError | DatabaseError>> {
		logger.debug("Creating user", { email: data.email });

		const nameValidation = this.validateName(data.name);

		if (nameValidation.isErr()) {
			logger.warn("User creation failed: empty name");
			return err(nameValidation.error);
		}

		const cellphoneValidation = this.validateCellphone(data.cellphone);

		if (cellphoneValidation.isErr()) {
			logger.warn("User creation failed: invalid cellphone");
			return err(cellphoneValidation.error);
		}

		const result = await this.repository.create(data);

		return result.map((user) => {
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

		if (data.name !== undefined) {
			const nameValidation = this.validateName(data.name);

			if (nameValidation.isErr()) {
				logger.warn("User update failed: empty name", { id });
				return err(nameValidation.error);
			}
		}

		if (data.cellphone !== undefined) {
			const cellphoneValidation = this.validateCellphone(data.cellphone);

			if (cellphoneValidation.isErr()) {
				logger.warn("User update failed: invalid cellphone", { id });
				return err(cellphoneValidation.error);
			}
		}

		const result = await this.repository.update(id, data);

		return result.map((user) => {
			logger.info("User updated successfully", { id });
			return user;
		});
	}

	async deleteUser(
		id: string,
	): Promise<Result<void, NotFoundError | DatabaseError>> {
		logger.debug("Deleting user", { id });

		const result = await this.repository.delete(id);

		return result.map(() => {
			logger.info("User deleted successfully", { id });
			return undefined;
		});
	}
}
