import type { Result } from "neverthrow";

import type { DatabaseError, NotFoundError } from "@/common/errors";
import type { PaginatedResult } from "@/common/types";
import type { AsyncDomainResult } from "@/common/types/database-result";
import type { Account, Client } from "@/db/schema";

import type { CreateClientInput } from "./client.types";

export type ClientListItem = Pick<Account, "id" | "name" | "cellphone">;

export interface IClientRepository {
	findAll(
		page: number,
		limit: number,
		storeId: string,
	): Promise<Result<PaginatedResult<ClientListItem>, DatabaseError>>;

	create(data: CreateClientInput): Promise<Result<Client, DatabaseError>>;

	delete(id: string): Promise<Result<void, NotFoundError | DatabaseError>>;

	exists(id: string): AsyncDomainResult<boolean>;
}
