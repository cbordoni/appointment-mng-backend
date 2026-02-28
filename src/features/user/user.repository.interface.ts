import type { IRepository } from "@/common/repository/repository.interfance";
import type { AsyncDomainResult } from "@/common/types/database-result";
import type { User } from "@/db/schema";

import type { CreateUserInput, UpdateUserInput } from "./user.types";

export interface IUserRepository
	extends IRepository<User, CreateUserInput, UpdateUserInput> {
	exists(id: string): AsyncDomainResult<boolean>;

	findByEmail(email: string): AsyncDomainResult<User>;
}
