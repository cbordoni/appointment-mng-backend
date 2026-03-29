import type { PaginatedResult } from "@/common/types";
import type { AsyncDomainResult } from "@/common/types/database-result";
import type { Store } from "@/db/schema";
import type { CreateStoreInput, UpdateStoreInput } from "./store.types";

export interface IStoreRepository {
	// biome-ignore format: to keep the method signatures clear and consistent
	findAll(page: number, limit: number): AsyncDomainResult<PaginatedResult<Partial<Store>>>;

	findById(id: string): AsyncDomainResult<Store>;

	create(data: CreateStoreInput): AsyncDomainResult<Store>;

	// biome-ignore format: to keep the method signatures clear and consistent
	update(id: string, data: UpdateStoreInput): AsyncDomainResult<Store>;

	delete(id: Store["id"]): AsyncDomainResult<void>;
	exists(id: string): AsyncDomainResult<boolean>;
}
