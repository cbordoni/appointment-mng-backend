import type { IRepository } from "@/common/repository/repository.interfance";
import type { AsyncDomainResult } from "@/common/types/database-result";
import type { PaginatedResult } from "@/common/types/pagination";
import type { Appointment } from "@/db/schema";

import type {
	AppointmentWithClient,
	CreateAppointmentInput,
	UpdateAppointmentInput,
} from "./appointment.types";

// biome-ignore format: to keep the method signatures clear and consistent
export interface IAppointmentRepository extends IRepository<Appointment, CreateAppointmentInput, UpdateAppointmentInput> {
	// biome-ignore format: to keep the method signatures clear and consistent
	findByDateRange(storeId: string, from?: Date, to?: Date): AsyncDomainResult<AppointmentWithClient[]>;

	// biome-ignore format: to keep the method signatures clear and consistent
	findByClientId(clientId: string, page: number, limit: number, storeId: string): AsyncDomainResult<PaginatedResult<Appointment>>;

	// biome-ignore format: to keep the method signatures clear and consistent
	findByProfessionalId(professionalId: string, page: number, limit: number, storeId: string): AsyncDomainResult<PaginatedResult<Appointment>>;

	// biome-ignore format: to keep the method signatures clear and consistent
	hasConflictInAppointments(professionalId: string, dtStart: Date, dtEnd: Date, excludedAppointmentId?: string): AsyncDomainResult<boolean>;
}
