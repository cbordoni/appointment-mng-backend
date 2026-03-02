import { err, ok } from "neverthrow";

import { ValidationError } from "@/common/errors";
import { toPaginated } from "@/common/http/to-paginated";
import { logger } from "@/common/logger";
import type { PaginatedResponse } from "@/common/types";
import type {
	AsyncDomainResult,
	DomainResult,
} from "@/common/types/database-result";
import type { Appointment } from "@/db/schema";

import { NoopAppointmentNotificationScheduler } from "./appointment.notification.scheduler";
import type { IAppointmentNotificationScheduler } from "./appointment.notification.scheduler.interface";
import type { IAppointmentRepository } from "./appointment.repository.interface";
import type {
	AppointmentEventWithSource,
	AppointmentProjection,
	AppointmentWithUser,
	CreateAppointmentEventInput,
	CreateAppointmentInput,
	DateRangeQuery,
	UpdateAppointmentInput,
} from "./appointment.types";

export class AppointmentService {
	constructor(
		private readonly repository: IAppointmentRepository,
		private readonly scheduler: IAppointmentNotificationScheduler = new NoopAppointmentNotificationScheduler(),
	) {}

	private validateDates(
		startDate: string | Date,
		endDate: string | Date,
	): DomainResult<void> {
		const start = new Date(startDate);
		const end = new Date(endDate);

		if (start >= end) {
			return err(new ValidationError("startDate must be before endDate"));
		}

		return ok(undefined);
	}

	private validateTitle(title: string): DomainResult<void> {
		if (title.trim().length === 0) {
			return err(new ValidationError("Title cannot be empty"));
		}

		return ok(undefined);
	}

	private validateAppointmentEventInput(
		data: CreateAppointmentEventInput,
	): DomainResult<void> {
		const {
			status,
			newAppointmentId,
			actualStartDate,
			actualEndDate,
			performedByUserId,
		} = data;

		if (status === "rescheduled" && !newAppointmentId) {
			return err(
				new ValidationError(
					"newAppointmentId is required for rescheduled events",
				),
			);
		}

		if (
			(actualStartDate && !actualEndDate) ||
			(!actualStartDate && actualEndDate)
		) {
			return err(
				new ValidationError(
					"actualStartDate and actualEndDate must be provided together",
				),
			);
		}

		if (actualStartDate && actualEndDate) {
			const dateValidation = this.validateDates(actualStartDate, actualEndDate);

			if (dateValidation.isErr()) {
				return err(dateValidation.error);
			}
		}

		if (status === "completed" && !performedByUserId) {
			return err(
				new ValidationError(
					"performedByUserId is required for completed events",
				),
			);
		}

		return ok(undefined);
	}

	async getAllAppointments(
		query: DateRangeQuery = {},
	): AsyncDomainResult<AppointmentWithUser[]> {
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
	): AsyncDomainResult<PaginatedResponse<Appointment>> {
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

	async getProjectedAppointments(
		query: DateRangeQuery = {},
	): AsyncDomainResult<AppointmentProjection[]> {
		const from = query.from ? new Date(query.from) : undefined;
		const to = query.to ? new Date(query.to) : undefined;

		logger.debug("Projecting recurring appointments", { from, to });

		const result = await this.repository.findProjectedByDateRange(from, to);

		return result.map((items) => {
			logger.info("Recurring appointments projected successfully", {
				count: items.length,
			});

			return items;
		});
	}

	async getCalendarAppointments(
		query: DateRangeQuery = {},
	): AsyncDomainResult<AppointmentProjection[]> {
		const from = query.from ? new Date(query.from) : undefined;
		const to = query.to ? new Date(query.to) : undefined;

		logger.debug("Fetching calendar appointments", { from, to });

		const [nonRecurringResult, projectedResult] = await Promise.all([
			this.repository.findNonRecurringByDateRange(from, to),
			this.repository.findProjectedByDateRange(from, to),
		]);

		if (nonRecurringResult.isErr()) {
			return err(nonRecurringResult.error);
		}

		if (projectedResult.isErr()) {
			return err(projectedResult.error);
		}

		const items = [...nonRecurringResult.value, ...projectedResult.value].sort(
			(left, right) => left.startDate.getTime() - right.startDate.getTime(),
		);

		return ok(items).map((calendarItems) => {
			logger.info("Calendar appointments fetched successfully", {
				count: calendarItems.length,
			});

			return calendarItems;
		});
	}

	async getAppointmentById(id: string): AsyncDomainResult<Appointment> {
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
	): AsyncDomainResult<Appointment> {
		const { title, startDate, endDate, userId } = data;

		logger.debug("Creating appointment", { userId });

		const titleValidation = this.validateTitle(title);

		if (titleValidation.isErr()) {
			return err(titleValidation.error);
		}

		const datesValidation = this.validateDates(startDate, endDate);

		if (datesValidation.isErr()) {
			return err(datesValidation.error);
		}

		const createResult = await this.repository.create(data);

		if (createResult.isErr()) {
			return err(createResult.error);
		}

		const { value } = createResult;

		const scheduleResult = await this.scheduler.scheduleForAppointment(value);

		if (scheduleResult.isErr()) {
			logger.warn("Failed to schedule appointment notifications", {
				appointmentId: value.id,
				error: scheduleResult.error.message,
			});
		}

		return ok(value).map((appointment) => {
			logger.info("Appointment created successfully", { id: appointment.id });
			return appointment;
		});
	}

	async updateAppointment(
		id: string,
		data: UpdateAppointmentInput,
	): AsyncDomainResult<Appointment> {
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

		const scheduleResult = await this.scheduler.rescheduleForAppointment(
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

	async deleteAppointment(id: string): AsyncDomainResult<void> {
		logger.debug("Deleting appointment", { id });

		const deleteResult = await this.repository.delete(id);

		if (deleteResult.isErr()) {
			return err(deleteResult.error);
		}

		const clearResult = await this.scheduler.clearForAppointment(id);

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

	async createAppointmentEvent(
		appointmentId: string,
		data: CreateAppointmentEventInput,
	): AsyncDomainResult<AppointmentEventWithSource> {
		const validationResult = this.validateAppointmentEventInput(data);

		if (validationResult.isErr()) {
			return err(validationResult.error);
		}

		logger.debug("Creating appointment event", {
			appointmentId,
			status: data.status,
		});

		const result = await this.repository.createEvent(appointmentId, data);

		return result.map((event) => {
			logger.info("Appointment event created successfully", {
				appointmentId,
				eventId: event.id,
				status: event.status,
			});

			return event;
		});
	}

	async getAppointmentEventsByAppointmentId(
		appointmentId: string,
	): AsyncDomainResult<AppointmentEventWithSource[]> {
		logger.debug("Fetching appointment events", { appointmentId });

		const result =
			await this.repository.findEventsByAppointmentId(appointmentId);

		return result.map((events) => {
			logger.info("Appointment events fetched successfully", {
				appointmentId,
				count: events.length,
			});

			return events;
		});
	}
}
