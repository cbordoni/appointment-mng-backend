import type { IRepository } from "@/common/repository/repository.interfance";
import type { AsyncDomainResult } from "@/common/types/database-result";
import type { PaginatedResult } from "@/common/types/pagination";
import type { Appointment } from "@/db/schema";

import type {
	AppointmentWithUser,
	CreateAppointmentInput,
	UpdateAppointmentInput,
} from "./appointment.types";

// biome-ignore format: to keep the method signatures clear and consistent
export interface IAppointmentRepository extends IRepository<Appointment, CreateAppointmentInput, UpdateAppointmentInput> {
	// biome-ignore format: to keep the method signatures clear and consistent
	findByDateRange(from?: Date, to?: Date): AsyncDomainResult<AppointmentWithUser[]>;

	// biome-ignore format: to keep the method signatures clear and consistent
	findByUserId(userId: string, page: number, limit: number): AsyncDomainResult<PaginatedResult<Appointment>>;
}
