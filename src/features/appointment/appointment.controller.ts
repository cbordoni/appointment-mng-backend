import { BaseController } from "@/common/http/base-controller";
import type { PaginationQuery } from "@/common/types";

import type { AppointmentService } from "./appointment.service";
import type {
	CreateAppointmentInput,
	DateRangeQuery,
	UpdateAppointmentInput,
} from "./appointment.types";

export class AppointmentController extends BaseController {
	constructor(private readonly service: AppointmentService) {
		super();
	}

	async getAll(query: DateRangeQuery) {
		return (await this.service.getAllAppointments(query)).match(
			(data) => ({ data }),
			this.handleError,
		);
	}

	async getAllByUserId(userId: string, query: PaginationQuery) {
		const { page = 1, limit = 10 } = query;

		return (
			await this.service.getAppointmentsByUserId(userId, page, limit)
		).match((data) => ({ data }), this.handleError);
	}

	async getById(id: string) {
		return (await this.service.getAppointmentById(id)).match(
			(data) => ({ data }),
			this.handleError,
		);
	}

	async create(data: CreateAppointmentInput) {
		return (await this.service.createAppointment(data)).match(
			(data) => ({ data }),
			this.handleError,
		);
	}

	async update(id: string, data: UpdateAppointmentInput) {
		return (await this.service.updateAppointment(id, data)).match(
			(data) => ({ data }),
			this.handleError,
		);
	}

	async delete(id: string) {
		return (await this.service.deleteAppointment(id)).match(
			() => ({ status: 204 }),
			this.handleError,
		);
	}
}
