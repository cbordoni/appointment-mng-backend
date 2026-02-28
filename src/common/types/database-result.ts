import type { Result } from "neverthrow";

import type { DomainError } from "../errors";

export type DomainResult<T> = Result<T, DomainError>;

export type AsyncDomainResult<T> = Promise<Result<T, DomainError>>;
