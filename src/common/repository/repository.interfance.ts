import type { Result } from "neverthrow";

import type { DatabaseError, NotFoundError } from "../errors";
import type { PaginatedResult } from "../types";

// biome-ignore format: to keep the method signatures clear and consistent
export interface IRepository<T extends { id: unknown }, CreateInput, UpdateInput> {
	// biome-ignore format: to keep the method signatures clear and consistent
	findAll(page: number, limit: number): Promise<Result<PaginatedResult<T>, DatabaseError>>;

	findById(id: string): Promise<Result<T, NotFoundError | DatabaseError>>;

	create(data: CreateInput): Promise<Result<T, DatabaseError>>;

	// biome-ignore format: to keep the method signatures clear and consistent
	update(id: T["id"], data: UpdateInput): Promise<Result<T, NotFoundError | DatabaseError>>;

	delete(id: T["id"]): Promise<Result<void, NotFoundError | DatabaseError>>;
}
