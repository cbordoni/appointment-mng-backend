import { err, ok } from "neverthrow";

import { ValidationError } from "@/common/errors";
import { toPaginated } from "@/common/http/to-paginated";
import { logger } from "@/common/logger";
import type { DomainResult } from "@/common/types/database-result";
import type { IScheduler } from "../scheduler/scheduler.interface";
import type { IAppointmentRepository } from "./appointment.repository.interface";
import type {
	CreateAppointmentInput,
	DateRangeQuery,
	UpdateAppointmentInput,
} from "./appointment.types";

export class AppointmentService {
	constructor(
		private readonly repository: IAppointmentRepository,
		private readonly scheduler: IScheduler,
	) {}

	private validateDates(
		startDate: string,
		endDate: string,
	): DomainResult<void> {
		const start = new Date(startDate);
		const end = new Date(endDate);

		return start >= end
			? err(new ValidationError("startDate must be before endDate"))
			: ok(undefined);
	}

	private validateTitle(title: string): DomainResult<void> {
		return title.trim().length === 0
			? err(new ValidationError("Title cannot be empty"))
			: ok(undefined);
	}

	async getAllAppointments(query: DateRangeQuery = {}) {
		const from = query.from ? new Date(query.from) : undefined;
		const to = query.to ? new Date(query.to) : undefined;

		logger.debug("Fetching appointments by date range", { from, to });

		const result = await this.repository.findByDateRange(from, to);

		return result.map((items) => {
			logger.info("Appointments fetched successfully", { count: items.length });
			return items;
		});
	}

	async getAppointmentsByUserId(userId: string, page = 1, limit = 10) {
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

	async getAppointmentById(id: string) {
		logger.debug("Fetching appointment by id", { id });

		const result = await this.repository.findById(id);

		result.match(
			() => logger.info("Appointment fetched successfully", { id }),
			() => logger.warn("Appointment not found", { id }),
		);

		return result;
	}

	async createAppointment(data: CreateAppointmentInput) {
		const { title, startDate, endDate, userId } = data;

		logger.debug("Creating appointment", { userId });

		const validationResult = this.validateTitle(title)
			// Validate dates only if both are provided
			.andThen(() => this.validateDates(startDate, endDate));

		if (validationResult.isErr()) {
			return err(validationResult.error);
		}

		return (await this.repository.create(data)).map(async (value) => {
			const scheduleResult = await this.scheduler.schedule({
				id: value.id,
				startDate: value.startDate,
			});

			if (scheduleResult.isErr()) {
				logger.warn("Failed to schedule appointment notifications", {
					appointmentId: value.id,
					error: scheduleResult.error.message,
				});
			}

			logger.info("Appointment created successfully", { id: value.id });

			return ok(value);
		});
	}

	async updateAppointment(id: string, data: UpdateAppointmentInput) {
		logger.debug("Updating appointment", { id });

		const titleValidationResult =
			data.title !== undefined ? this.validateTitle(data.title) : ok(undefined);

		if (titleValidationResult.isErr()) {
			return err(titleValidationResult.error);
		}

		const hasStartDate = data.startDate !== undefined;
		const hasEndDate = data.endDate !== undefined;

		const datesValidationResult =
			hasStartDate && hasEndDate
				? this.validateDates(data.startDate as string, data.endDate as string)
				: ok(undefined);

		const validationResult = titleValidationResult
			// Validate dates only if both startDate and endDate are provided
			.andThen(() => datesValidationResult);

		if (validationResult.isErr()) {
			return err(validationResult.error);
		}

		return (await this.repository.update(id, data)).map(async (value) => {
			const scheduleResult = await this.scheduler.reschedule({
				id: value.id,
				startDate: value.startDate,
			});

			if (scheduleResult.isErr()) {
				logger.warn("Failed to reschedule appointment notifications", {
					appointmentId: value.id,
					error: scheduleResult.error.message,
				});
			}

			logger.info("Appointment updated successfully", { id });

			return ok(value);
		});
	}

	async deleteAppointment(id: string) {
		logger.debug("Deleting appointment", { id });

		return (await this.repository.delete(id)).map(async () => {
			logger.info("Appointment deleted successfully", { id });

			await this.scheduler.clear(id).then((clearResult) => {
				if (clearResult.isErr()) {
					logger.warn("Failed to clear appointment notifications", {
						appointmentId: id,
						error: clearResult.error.message,
					});
				}
			});

			return ok(undefined);
		});
	}
}
