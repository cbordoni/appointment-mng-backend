import { err, ok, type Result } from "neverthrow";

import {
	type DatabaseError,
	type NotFoundError,
	ValidationError,
} from "@/common/errors";
import { toPaginated } from "@/common/http/to-paginated";
import { logger } from "@/common/logger";
import type { PaginatedResponse } from "@/common/types";
import type { Appointment } from "@/db/schema";

import {
	type IAppointmentNotificationScheduler,
	NoopAppointmentNotificationScheduler,
} from "./appointment.notification.scheduler";
import type { IAppointmentRepository } from "./appointment.repository.interface";
import type {
	AppointmentWithUser,
	CreateAppointmentInput,
	DateRangeQuery,
	UpdateAppointmentInput,
} from "./appointment.types";

export class AppointmentService {
	constructor(
		private readonly repository: IAppointmentRepository,
		private readonly notificationScheduler: IAppointmentNotificationScheduler = new NoopAppointmentNotificationScheduler(),
	) {}

	private validateDates(
		startDate: string | Date,
		endDate: string | Date,
	): Result<void, ValidationError> {
		const start = new Date(startDate);
		const end = new Date(endDate);

		if (start >= end) {
			return err(new ValidationError("startDate must be before endDate"));
		}

		return ok(undefined);
	}

	private validateTitle(title: string): Result<void, ValidationError> {
		if (title.trim().length === 0) {
			return err(new ValidationError("Title cannot be empty"));
		}

		return ok(undefined);
	}

	async getAllAppointments(
		query: DateRangeQuery = {},
	): Promise<Result<AppointmentWithUser[], DatabaseError>> {
		const from = query.from ? new Date(query.from) : undefined;
		const to = query.to ? new Date(query.to) : undefined;

		logger.debug("Fetching appointments by date range", { from, to });

		const result = await this.repository.findByDateRange(from, to);

		return result.map((items) => {
			logger.info("Appointments fetched successfully", { count: items.length });
			return items;
		});
	}

	async getAppointmentsByUserId(
		userId: string,
		page = 1,
		limit = 10,
	): Promise<Result<PaginatedResponse<Appointment>, DatabaseError>> {
		logger.debug("Fetching appointments by user", { userId, page, limit });

		const result = await this.repository.findByUserId(userId, page, limit);

		return result.map((data) => {
			logger.info("User appointments fetched successfully", {
				userId,
				count: data.items.length,
				total: data.total,
			});

			return toPaginated(data, page, limit);
		});
	}

	async getAppointmentById(
		id: string,
	): Promise<Result<Appointment, NotFoundError | DatabaseError>> {
		logger.debug("Fetching appointment by id", { id });

		const result = await this.repository.findById(id);

		if (result.isOk()) {
			logger.info("Appointment fetched successfully", { id });
		} else {
			logger.warn("Appointment not found", { id });
		}

		return result;
	}

	async createAppointment(
		data: CreateAppointmentInput,
	): Promise<Result<Appointment, ValidationError | DatabaseError>> {
		logger.debug("Creating appointment", { userId: data.userId });

		const titleValidation = this.validateTitle(data.title);

		if (titleValidation.isErr()) {
			return err(titleValidation.error);
		}

		const datesValidation = this.validateDates(data.startDate, data.endDate);

		if (datesValidation.isErr()) {
			return err(datesValidation.error);
		}

		const createResult = await this.repository.create(data);

		if (createResult.isErr()) {
			return err(createResult.error);
		}

		const scheduleResult =
			await this.notificationScheduler.scheduleForAppointment(
				createResult.value,
			);

		if (scheduleResult.isErr()) {
			logger.warn("Failed to schedule appointment notifications", {
				appointmentId: createResult.value.id,
				error: scheduleResult.error.message,
			});
		}

		return ok(createResult.value).map((appointment) => {
			logger.info("Appointment created successfully", { id: appointment.id });
			return appointment;
		});
	}

	async updateAppointment(
		id: string,
		data: UpdateAppointmentInput,
	): Promise<
		Result<Appointment, ValidationError | NotFoundError | DatabaseError>
	> {
		logger.debug("Updating appointment", { id });

		if (data.title !== undefined) {
			const titleValidation = this.validateTitle(data.title);

			if (titleValidation.isErr()) {
				return err(titleValidation.error);
			}
		}

		const hasStartDate = data.startDate !== undefined;
		const hasEndDate = data.endDate !== undefined;

		if (hasStartDate && hasEndDate) {
			const datesValidation = this.validateDates(
				data.startDate as string,
				data.endDate as string,
			);

			if (datesValidation.isErr()) {
				return err(datesValidation.error);
			}
		}

		const updateResult = await this.repository.update(id, data);

		if (updateResult.isErr()) {
			return err(updateResult.error);
		}

		const scheduleResult =
			await this.notificationScheduler.rescheduleForAppointment(
				updateResult.value,
			);

		if (scheduleResult.isErr()) {
			logger.warn("Failed to reschedule appointment notifications", {
				appointmentId: updateResult.value.id,
				error: scheduleResult.error.message,
			});
		}

		return ok(updateResult.value).map((appointment) => {
			logger.info("Appointment updated successfully", { id });
			return appointment;
		});
	}

	async deleteAppointment(
		id: string,
	): Promise<Result<void, NotFoundError | DatabaseError>> {
		logger.debug("Deleting appointment", { id });

		const deleteResult = await this.repository.delete(id);

		if (deleteResult.isErr()) {
			return err(deleteResult.error);
		}

		const clearResult =
			await this.notificationScheduler.clearForAppointment(id);

		if (clearResult.isErr()) {
			logger.warn("Failed to clear appointment notifications", {
				appointmentId: id,
				error: clearResult.error.message,
			});
		}

		return ok(undefined).map(() => {
			logger.info("Appointment deleted successfully", { id });
			return undefined;
		});
	}
}
