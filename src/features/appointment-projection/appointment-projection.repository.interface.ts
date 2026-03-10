import type { AsyncDomainResult } from "@/common/types/database-result";

import type { AppointmentProjectionRow } from "./appointment-projection.types";

export interface IAppointmentProjectionRepository {
	findProjectionContext(
		from: Date,
		to: Date,
	): AsyncDomainResult<AppointmentProjectionRow[]>;
}
