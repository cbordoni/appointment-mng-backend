import type { IRepository } from "@/common/repository/repository.interfance";
import type { AsyncDomainResult } from "@/common/types/database-result";
import type { PaginatedResult } from "@/common/types/pagination";
import type { Appointment } from "@/db/schema";

import type {
	AppointmentEventWithSource,
	AppointmentProjection,
	AppointmentWithClient,
	CreateAppointmentEventInput,
	CreateAppointmentInput,
	UpdateAppointmentInput,
} from "./appointment.types";

// biome-ignore format: to keep the method signatures clear and consistent
export interface IAppointmentRepository extends IRepository<Appointment, CreateAppointmentInput, UpdateAppointmentInput> {
	// biome-ignore format: to keep the method signatures clear and consistent
	findByDateRange(from?: Date, to?: Date): AsyncDomainResult<AppointmentWithClient[]>;

	// biome-ignore format: to keep the method signatures clear and consistent
	findNonRecurringByDateRange(from?: Date, to?: Date): AsyncDomainResult<AppointmentProjection[]>;

	// biome-ignore format: to keep the method signatures clear and consistent
	findByClientId(clientId: string, page: number, limit: number): AsyncDomainResult<PaginatedResult<Appointment>>;

	// biome-ignore format: to keep the method signatures clear and consistent
	findProjectedByDateRange(from?: Date, to?: Date): AsyncDomainResult<AppointmentProjection[]>;

	// biome-ignore format: to keep the method signatures clear and consistent
	hasConflictInAppointments(clientId: string, startDate: Date, endDate: Date, excludedAppointmentId?: string): AsyncDomainResult<boolean>;

	// biome-ignore format: to keep the method signatures clear and consistent
	hasConflictInProjection(clientId: string, startDate: Date, endDate: Date, excludedAppointmentId?: string): AsyncDomainResult<boolean>;

	// biome-ignore format: to keep the method signatures clear and consistent
	createEvent(appointmentId: string, data: CreateAppointmentEventInput): AsyncDomainResult<AppointmentEventWithSource>;

	// biome-ignore format: to keep the method signatures clear and consistent
	findEventsByAppointmentId(appointmentId: string): AsyncDomainResult<AppointmentEventWithSource[]>;
}
