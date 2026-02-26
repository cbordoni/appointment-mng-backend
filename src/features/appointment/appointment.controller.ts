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
		const result = await this.service.getAllAppointments(query);

		return result.match((data) => ({ data }), this.handleError);
	}

	async getAllByUserId(userId: string, query: PaginationQuery) {
		const { page = 1, limit = 10 } = query;

		const result = await this.service.getAppointmentsByUserId(
			userId,
			page,
			limit,
		);

		return result.match((paginatedData) => paginatedData, this.handleError);
	}

	async getById(id: string) {
		const result = await this.service.getAppointmentById(id);

		return result.match(
			(appointment) => ({ data: appointment }),
			this.handleError,
		);
	}

	async create(data: CreateAppointmentInput) {
		const result = await this.service.createAppointment(data);

		return result.match(
			(appointment) => ({ data: appointment }),
			this.handleError,
		);
	}

	async update(id: string, data: UpdateAppointmentInput) {
		const result = await this.service.updateAppointment(id, data);

		return result.match(
			(appointment) => ({ data: appointment }),
			this.handleError,
		);
	}

	async delete(id: string) {
		const result = await this.service.deleteAppointment(id);

		return result.match(() => ({ status: 204 }), this.handleError);
	}
}
