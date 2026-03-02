import { BaseController } from "@/common/http/base-controller";

import type { CreateAppointmentEventInput } from "../appointment.types";
import type { AppointmentEventService } from "./event.service";

export class AppointmentEventController extends BaseController {
	constructor(private readonly service: AppointmentEventService) {
		super();
	}

	async createEvent(appointmentId: string, data: CreateAppointmentEventInput) {
		return (
			await this.service.createAppointmentEvent(appointmentId, data)
		).match((event) => ({ data: event }), this.handleError);
	}

	async getEventsByAppointmentId(appointmentId: string) {
		return (
			await this.service.getAppointmentEventsByAppointmentId(appointmentId)
		).match((events) => ({ data: events }), this.handleError);
	}
}
