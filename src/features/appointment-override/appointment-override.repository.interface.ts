import type { IRepository } from "@/common/repository/repository.interfance";
import type { AsyncDomainResult } from "@/common/types/database-result";
import type { AppointmentOverride } from "@/db/schema";

import type {
	AppointmentOverrideReplaceInput,
	CreateAppointmentOverrideInput,
	UpdateAppointmentOverrideInput,
} from "./appointment-override.types";

export interface IAppointmentOverrideRepository
	extends IRepository<
		AppointmentOverride,
		CreateAppointmentOverrideInput,
		UpdateAppointmentOverrideInput
	> {
	findByAppointmentIds(
		appointmentIds: string[],
	): AsyncDomainResult<AppointmentOverride[]>;

	replaceByAppointmentId(
		appointmentId: string,
		overrides: AppointmentOverrideReplaceInput[],
	): AsyncDomainResult<void>;
}
