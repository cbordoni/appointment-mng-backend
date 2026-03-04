import type { IRepository } from "@/common/repository/repository.interfance";
import type { AsyncDomainResult } from "@/common/types/database-result";
import type { Client } from "@/db/schema";

import type { CreateClientInput, UpdateClientInput } from "./client.types";

export interface IClientRepository
	extends IRepository<Client, CreateClientInput, UpdateClientInput> {
	exists(id: string): AsyncDomainResult<boolean>;

	findByEmail(email: string): AsyncDomainResult<Client>;
}
