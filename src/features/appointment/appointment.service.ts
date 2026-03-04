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

	private async validateProfessionalConflict(
		professionalId: string,
		startDate: Date,
		endDate: Date,
		excludedAppointmentId?: string,
	): Promise<DomainResult<void>> {
		const [appointmentsConflictResult, projectionConflictResult] =
			await Promise.all([
				this.repository.hasConflictInAppointments(
					professionalId,
					startDate,
					endDate,
					excludedAppointmentId,
				),
				this.repository.hasConflictInProjection(
					professionalId,
					startDate,
					endDate,
					excludedAppointmentId,
				),
			]);

		if (appointmentsConflictResult.isErr()) {
			return err(appointmentsConflictResult.error);
		}

		if (projectionConflictResult.isErr()) {
			return err(projectionConflictResult.error);
		}

		if (appointmentsConflictResult.value || projectionConflictResult.value) {
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
		const { title, startDate, endDate, clientId, professionalId } = data;

		logger.debug("Creating appointment", { clientId });

		const validationResult = this.validateTitle(title)
			// Validate dates only if both are provided
			.andThen(() => this.validateDates(startDate, endDate));

		if (validationResult.isErr()) {
			return err(validationResult.error);
		}

		const conflictValidationResult = await this.validateProfessionalConflict(
			professionalId,
			new Date(startDate),
			new Date(endDate),
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
	}

	async updateAppointment(id: string, data: UpdateAppointmentInput) {
		logger.debug("Updating appointment", { id });

		const currentAppointmentResult = await this.repository.findById(id);

		if (currentAppointmentResult.isErr()) {
			return err(currentAppointmentResult.error);
		}

		const currentAppointment = currentAppointmentResult.value;

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

		const startDate = new Date(data.startDate ?? currentAppointment.startDate);
		const endDate = new Date(data.endDate ?? currentAppointment.endDate);

		const conflictValidationResult = await this.validateProfessionalConflict(
			data.professionalId ?? currentAppointment.professionalId,
			startDate,
			endDate,
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
