import { err, ok } from "neverthrow";

import { ValidationError } from "@/common/errors";
import { toPaginated } from "@/common/http/to-paginated";
import { logger } from "@/common/logger";
import type { DomainResult } from "@/common/types/database-result";
import type { IScheduler } from "@/features/scheduler/scheduler.interface";

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

	private validateDates(dtStart: string, dtEnd: string): DomainResult<void> {
		const start = new Date(dtStart);
		const end = new Date(dtEnd);

		return start >= end
			? err(new ValidationError("dtStart must be before dtEnd"))
			: ok(undefined);
	}

	private validateSummary(summary: string): DomainResult<void> {
		return summary.trim().length === 0
			? err(new ValidationError("Summary cannot be empty"))
			: ok(undefined);
	}

	private validateRRule(rrule?: string | null): DomainResult<void> {
		if (rrule === undefined || rrule === null) {
			return ok(undefined);
		}

		const rruleRegex =
			/^(FREQ=(SECONDLY|MINUTELY|HOURLY|DAILY|WEEKLY|MONTHLY|YEARLY))(;([A-Z]+)=([^;\s]+))*$/;

		return rruleRegex.test(rrule)
			? ok(undefined)
			: err(
					new ValidationError("Invalid rrule. Expected RFC 5545 RRULE format"),
				);
	}

	private async validateProfessionalConflict(
		professionalId: string,
		dtStart: Date,
		dtEnd: Date,
		excludedAppointmentId?: string,
	): Promise<DomainResult<void>> {
		const appointmentsConflictResult =
			await this.repository.hasConflictInAppointments(
				professionalId,
				dtStart,
				dtEnd,
				excludedAppointmentId,
			);

		if (appointmentsConflictResult.isErr()) {
			return err(appointmentsConflictResult.error);
		}

		if (appointmentsConflictResult.value) {
			return err(
				new ValidationError(
					"Professional has scheduling conflict for the selected period",
				),
			);
		}

		return ok(undefined);
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

	async getAppointmentsByClientId(clientId: string, page = 1, limit = 10) {
		logger.debug("Fetching appointments by client", { clientId, page, limit });

		const result = await this.repository.findByClientId(clientId, page, limit);

		return result.map((data) => {
			logger.info("Client appointments fetched successfully", {
				clientId,
				count: data.items.length,
				total: data.total,
			});

			return toPaginated(data, page, limit);
		});
	}

	async getAppointmentsByProfessionalId(
		professionalId: string,
		page = 1,
		limit = 10,
	) {
		logger.debug("Fetching appointments by professional", {
			professionalId,
			page,
			limit,
		});

		const result = await this.repository.findByProfessionalId(
			professionalId,
			page,
			limit,
		);

		return result.map((data) => {
			logger.info("Professional appointments fetched successfully", {
				professionalId,
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
		const { summary, dtStart, dtEnd, clientId, professionalId, rrule } = data;

		logger.debug("Creating appointment", { clientId });

		const validationResult = this.validateSummary(summary)
			.andThen(() => this.validateRRule(rrule))
			// Validate dates only if both are provided
			.andThen(() => this.validateDates(dtStart, dtEnd));

		if (validationResult.isErr()) {
			return err(validationResult.error);
		}

		const conflictValidationResult = await this.validateProfessionalConflict(
			professionalId,
			new Date(dtStart),
			new Date(dtEnd),
		);

		if (conflictValidationResult.isErr()) {
			return err(conflictValidationResult.error);
		}

		const createResult = await this.repository.create(data);

		if (createResult.isErr()) {
			return err(createResult.error);
		}

		const value = createResult.value;

		const scheduleResult = await this.scheduler.schedule({
			id: value.id,
			startDate: value.dtStart,
		});

		if (scheduleResult.isErr()) {
			logger.warn("Failed to schedule appointment notifications", {
				appointmentId: value.id,
				error: scheduleResult.error.message,
			});
		}

		logger.info("Appointment created successfully", { id: value.id });

		return ok(value);
	}

	async updateAppointment(id: string, data: UpdateAppointmentInput) {
		logger.debug("Updating appointment", { id });

		const currentAppointmentResult = await this.repository.findById(id);

		if (currentAppointmentResult.isErr()) {
			return err(currentAppointmentResult.error);
		}

		const currentAppointment = currentAppointmentResult.value;

		const summaryValidationResult =
			data.summary !== undefined
				? this.validateSummary(data.summary)
				: ok(undefined);

		const rruleValidationResult = this.validateRRule(data.rrule);

		if (summaryValidationResult.isErr()) {
			return err(summaryValidationResult.error);
		}

		if (rruleValidationResult.isErr()) {
			return err(rruleValidationResult.error);
		}

		const hasDtStart = data.dtStart !== undefined;
		const hasDtEnd = data.dtEnd !== undefined;

		const datesValidationResult =
			hasDtStart && hasDtEnd
				? this.validateDates(data.dtStart as string, data.dtEnd as string)
				: ok(undefined);

		const validationResult = summaryValidationResult
			.andThen(() => rruleValidationResult)
			// Validate dates only if both dtStart and dtEnd are provided
			.andThen(() => datesValidationResult);

		if (validationResult.isErr()) {
			return err(validationResult.error);
		}

		const dtStart = new Date(data.dtStart ?? currentAppointment.dtStart);
		const dtEnd = new Date(data.dtEnd ?? currentAppointment.dtEnd);

		const conflictValidationResult = await this.validateProfessionalConflict(
			data.professionalId ?? currentAppointment.professionalId,
			dtStart,
			dtEnd,
			id,
		);

		if (conflictValidationResult.isErr()) {
			return err(conflictValidationResult.error);
		}

		const updateResult = await this.repository.update(id, data);

		if (updateResult.isErr()) {
			return err(updateResult.error);
		}

		const value = updateResult.value;

		const scheduleResult = await this.scheduler.reschedule({
			id: value.id,
			startDate: value.dtStart,
		});

		if (scheduleResult.isErr()) {
			logger.warn("Failed to reschedule appointment notifications", {
				appointmentId: value.id,
				error: scheduleResult.error.message,
			});
		}

		logger.info("Appointment updated successfully", { id });

		return ok(value);
	}

	async deleteAppointment(id: string) {
		logger.debug("Deleting appointment", { id });

		const deleteResult = await this.repository.delete(id);

		if (deleteResult.isErr()) {
			return err(deleteResult.error);
		}

		logger.info("Appointment deleted successfully", { id });

		const clearResult = await this.scheduler.clear(id);

		if (clearResult.isErr()) {
			logger.warn("Failed to clear appointment notifications", {
				appointmentId: id,
				error: clearResult.error.message,
			});
		}

		return ok(undefined);
	}
}
