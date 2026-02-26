import type { Result } from "neverthrow";

import type { DomainError } from "@/common/errors";

export interface IHealthRepository {
	checkDatabaseConnection(): Promise<Result<number, DomainError>>;
}
