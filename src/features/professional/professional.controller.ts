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
		const { page = 1, limit = 10 } = query;

		return (await this.service.getAllProfessionals(page, limit)).match(
			(data) => ({ data }),
			this.handleError,
		);
	}

	async getById(id: string) {
		return (await this.service.getProfessionalById(id)).match(
			(data) => ({ data }),
			this.handleError,
		);
	}

	async create(data: CreateProfessionalInput) {
		return (await this.service.createProfessional(data)).match(
			(data) => ({ data, status: 201 }),
			this.handleError,
		);
	}

	async update(id: string, data: UpdateProfessionalInput) {
		return (await this.service.updateProfessional(id, data)).match(
			(data) => ({ data }),
			this.handleError,
		);
	}

	async delete(id: string) {
		return (await this.service.deleteProfessional(id)).match(
			() => ({ status: 204 }),
			this.handleError,
		);
	}
}
