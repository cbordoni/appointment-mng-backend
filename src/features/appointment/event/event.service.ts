import { err, ok } from "neverthrow";

import { ValidationError } from "@/common/errors";
import { logger } from "@/common/logger";
import type {
	AsyncDomainResult,
	DomainResult,
} from "@/common/types/database-result";

import type { IAppointmentRepository } from "../appointment.repository.interface";
import type {
	AppointmentEventWithSource,
	CreateAppointmentEventInput,
} from "../appointment.types";

export class AppointmentEventService {
	constructor(private readonly repository: IAppointmentRepository) {}

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

	private validateAppointmentEventInput(
		data: CreateAppointmentEventInput,
	): DomainResult<void> {
		const {
			status,
			newAppointmentId,
			actualStartDate,
			actualEndDate,
			performedByClientId,
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

		if (status === "completed" && !performedByClientId) {
			return err(
				new ValidationError(
					"performedByClientId is required for completed events",
				),
			);
		}

		return ok(undefined);
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
