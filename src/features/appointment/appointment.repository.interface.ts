import type { IRepository } from "@/common/repository/repository.interfance";
import type { AsyncDomainResult } from "@/common/types/database-result";
import type { PaginatedResult } from "@/common/types/pagination";
import type { Appointment } from "@/db/schema";

import type {
	AppointmentEventWithSource,
	AppointmentProjection,
	AppointmentWithUser,
	CreateAppointmentEventInput,
	CreateAppointmentInput,
	UpdateAppointmentInput,
} from "./appointment.types";

// biome-ignore format: to keep the method signatures clear and consistent
export interface IAppointmentRepository extends IRepository<Appointment, CreateAppointmentInput, UpdateAppointmentInput> {
	// biome-ignore format: to keep the method signatures clear and consistent
	findByDateRange(from?: Date, to?: Date): AsyncDomainResult<AppointmentWithUser[]>;

	// biome-ignore format: to keep the method signatures clear and consistent
	findNonRecurringByDateRange(from?: Date, to?: Date): AsyncDomainResult<AppointmentProjection[]>;

	// biome-ignore format: to keep the method signatures clear and consistent
	findByUserId(userId: string, page: number, limit: number): AsyncDomainResult<PaginatedResult<Appointment>>;

	// biome-ignore format: to keep the method signatures clear and consistent
	findProjectedByDateRange(from?: Date, to?: Date): AsyncDomainResult<AppointmentProjection[]>;

	// biome-ignore format: to keep the method signatures clear and consistent
	hasConflictInAppointments(userId: string, startDate: Date, endDate: Date, excludedAppointmentId?: string): AsyncDomainResult<boolean>;

	// biome-ignore format: to keep the method signatures clear and consistent
	hasConflictInProjection(userId: string, startDate: Date, endDate: Date, excludedAppointmentId?: string): AsyncDomainResult<boolean>;

	// biome-ignore format: to keep the method signatures clear and consistent
	createEvent(appointmentId: string, data: CreateAppointmentEventInput): AsyncDomainResult<AppointmentEventWithSource>;

	// biome-ignore format: to keep the method signatures clear and consistent
	findEventsByAppointmentId(appointmentId: string): AsyncDomainResult<AppointmentEventWithSource[]>;
}
