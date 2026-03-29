import type { AsyncDomainResult } from "@/common/types/database-result";
import type { Account } from "@/db/schema";

export interface IAuthRepository {
	findByTaxId(taxId: string): AsyncDomainResult<Account>;
}
