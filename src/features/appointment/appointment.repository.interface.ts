import type { Result } from "neverthrow";

import type { DatabaseError, NotFoundError } from "@/common/errors";
import type { PaginatedResult } from "@/common/types";
import type { Appointment } from "@/db/schema";
import type {
	AppointmentWithUser,
	CreateAppointmentInput,
	UpdateAppointmentInput,
} from "./appointment.types";

export interface IAppointmentRepository {
	findByDateRange(
		from?: Date,
		to?: Date,
	): Promise<Result<AppointmentWithUser[], DatabaseError>>;

	findById(
		id: string,
	): Promise<Result<Appointment, NotFoundError | DatabaseError>>;

	findByUserId(
		userId: string,
		page: number,
		limit: number,
	): Promise<Result<PaginatedResult<Appointment>, DatabaseError>>;

	create(
		data: CreateAppointmentInput,
	): Promise<Result<Appointment, DatabaseError>>;

	update(
		id: string,
		data: UpdateAppointmentInput,
	): Promise<Result<Appointment, NotFoundError | DatabaseError>>;

	delete(id: string): Promise<Result<void, NotFoundError | DatabaseError>>;
}
