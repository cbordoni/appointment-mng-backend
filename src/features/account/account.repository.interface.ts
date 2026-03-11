import type { IRepository } from "@/common/repository/repository.interfance";
import type { AsyncDomainResult } from "@/common/types/database-result";
import type { Account } from "@/db/schema";

import type {
	CreateAccountRepositoryInput,
	UpdateAccountRepositoryInput,
} from "./account.types";

export interface IAccountRepository
	extends IRepository<
		Account,
		CreateAccountRepositoryInput,
		UpdateAccountRepositoryInput
	> {
	exists(id: string): AsyncDomainResult<boolean>;
}
