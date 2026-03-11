import { BaseController } from "@/common/http/base-controller";

import type { PaginationQuery } from "@/common/types";
import type { ProfessionalService } from "./professional.service";
import type {
	CreateProfessionalInput,
	UpdateProfessionalInput,
} from "./professional.types";

export class ProfessionalController extends BaseController {
	constructor(private readonly service: ProfessionalService) {
		super();
	}

	async getAll(query: PaginationQuery) {
		const { page = 1, limit = 10, storeId } = query;

		const result = await this.service.getAllProfessionals(page, limit, storeId);

		return result.match((data) => ({ data }), this.handleError);
	}

	async getById(id: string) {
		const result = await this.service.getProfessionalById(id);

		return result.match((data) => ({ data }), this.handleError);
	}

	async create(data: CreateProfessionalInput) {
		const result = await this.service.createProfessional(data);

		return result.match((data) => ({ data, status: 201 }), this.handleError);
	}

	async update(id: string, data: UpdateProfessionalInput) {
		const result = await this.service.updateProfessional(id, data);

		return result.match((data) => ({ data }), this.handleError);
	}

	async delete(id: string) {
		const result = await this.service.deleteProfessional(id);

		return result.match(() => ({ status: 204 }), this.handleError);
	}
}
