import { BaseController } from "@/common/http/base-controller";

import type { DateRangeQuery } from "../appointment.types";
import type { AppointmentProjectionService } from "./projection.service";

export class AppointmentProjectionController extends BaseController {
	constructor(private readonly service: AppointmentProjectionService) {
		super();
	}

	async getProjected(query: DateRangeQuery) {
		return (await this.service.getProjectedAppointments(query)).match(
			(data) => ({ data }),
			this.handleError,
		);
	}

	async getCalendar(query: DateRangeQuery) {
		return (await this.service.getCalendarAppointments(query)).match(
			(data) => ({ data }),
			this.handleError,
		);
	}
}
