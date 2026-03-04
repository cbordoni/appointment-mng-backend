import type { IRepository } from "@/common/repository/repository.interfance";
import type { AsyncDomainResult } from "@/common/types/database-result";
import type { Professional } from "@/db/schema";

import type {
	CreateProfessionalInput,
	UpdateProfessionalInput,
} from "./professional.types";

export interface IProfessionalRepository
	extends IRepository<
		Professional,
		CreateProfessionalInput,
		UpdateProfessionalInput
	> {
	exists(id: string): AsyncDomainResult<boolean>;
}
