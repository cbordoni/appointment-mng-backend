import { BaseController } from "@/common/http/base-controller";

import type { AppointmentProjectionService } from "./appointment-projection.service";
import type { AppointmentProjectionQuery } from "./appointment-projection.types";

export class AppointmentProjectionController extends BaseController {
	constructor(private readonly service: AppointmentProjectionService) {
		super();
	}

	async getByRange(query: AppointmentProjectionQuery) {
		const result = await this.service.getByRange(query.from, query.to);

		return result.match((data) => ({ data }), this.handleError);
	}
}
