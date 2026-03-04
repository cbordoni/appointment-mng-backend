import type { IRepository } from "@/common/repository/repository.interfance";
import type { AsyncDomainResult } from "@/common/types/database-result";
import type { AppointmentExdate } from "@/db/schema";

import type {
	CreateAppointmentExceptionInput,
	UpdateAppointmentExceptionInput,
} from "./appointment-exception.types";

export interface IAppointmentExceptionRepository
	extends IRepository<
		AppointmentExdate,
		CreateAppointmentExceptionInput,
		UpdateAppointmentExceptionInput
	> {
	findByAppointmentIds(
		appointmentIds: string[],
	): AsyncDomainResult<AppointmentExdate[]>;

	replaceByAppointmentId(
		appointmentId: string,
		exdates: Date[],
	): AsyncDomainResult<void>;
}
