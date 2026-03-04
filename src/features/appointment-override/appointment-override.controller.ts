import { BaseController } from "@/common/http/base-controller";
import type { PaginationQuery } from "@/common/types";

import type { AppointmentOverrideService } from "./appointment-override.service";
import type {
	CreateAppointmentOverrideInput,
	UpdateAppointmentOverrideInput,
} from "./appointment-override.types";

export class AppointmentOverrideController extends BaseController {
	constructor(private readonly service: AppointmentOverrideService) {
		super();
	}

	async getAll(query: PaginationQuery) {
		const { page = 1, limit = 10 } = query;

		const result = await this.service.getAll(page, limit);

		return result.match((data) => ({ data }), this.handleError);
	}

	async getById(id: string) {
		const result = await this.service.getById(id);

		return result.match((data) => ({ data }), this.handleError);
	}

	async create(data: CreateAppointmentOverrideInput) {
		const result = await this.service.create(data);

		return result.match((data) => ({ data, status: 201 }), this.handleError);
	}

	async update(id: string, data: UpdateAppointmentOverrideInput) {
		const result = await this.service.update(id, data);

		return result.match((data) => ({ data }), this.handleError);
	}

	async delete(id: string) {
		const result = await this.service.delete(id);

		return result.match(() => ({ status: 204 }), this.handleError);
	}
}
