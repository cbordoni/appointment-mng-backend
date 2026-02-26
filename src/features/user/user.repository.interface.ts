import type { Result } from "neverthrow";

import type { DatabaseError, NotFoundError } from "@/common/errors";
import type { PaginatedResult } from "@/common/types";
import type { User } from "@/db/schema";
import type { CreateUserInput, UpdateUserInput } from "./user.types";

export interface IUserRepository {
	findAll(
		page: number,
		limit: number,
	): Promise<Result<PaginatedResult<User>, DatabaseError>>;

	findById(id: string): Promise<Result<User, NotFoundError | DatabaseError>>;

	exists(id: string): Promise<Result<boolean, DatabaseError>>;

	findByEmail(
		email: string,
	): Promise<Result<User, NotFoundError | DatabaseError>>;

	create(data: CreateUserInput): Promise<Result<User, DatabaseError>>;

	update(
		id: string,
		data: UpdateUserInput,
	): Promise<Result<User, NotFoundError | DatabaseError>>;

	delete(id: string): Promise<Result<void, NotFoundError | DatabaseError>>;
}
