import type { PaginatedResult } from "../types";
import type { AsyncDomainResult } from "../types/database-result";

// biome-ignore format: to keep the method signatures clear and consistent
export interface IRepository<T extends { id: unknown }, CreateInput, UpdateInput> {
	// biome-ignore format: to keep the method signatures clear and consistent
	findAll(page: number, limit: number, storeId: string): AsyncDomainResult<PaginatedResult<Partial<T>>>;

	findById(id: string): AsyncDomainResult<T>;

	create(data: CreateInput): AsyncDomainResult<T>;

	// biome-ignore format: to keep the method signatures clear and consistent
	update(id: T["id"], data: UpdateInput): AsyncDomainResult<T>;

	delete(id: T["id"]): AsyncDomainResult<void>;
}
