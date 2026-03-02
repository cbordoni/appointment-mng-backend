import { err, ok } from "neverthrow";

import { logger } from "@/common/logger";
import type { AsyncDomainResult } from "@/common/types/database-result";

import type { IAppointmentRepository } from "../appointment.repository.interface";
import type {
	AppointmentProjection,
	DateRangeQuery,
} from "../appointment.types";

export class AppointmentProjectionService {
	constructor(private readonly repository: IAppointmentRepository) {}

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
}
