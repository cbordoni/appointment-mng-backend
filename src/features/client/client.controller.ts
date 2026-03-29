import { BaseController } from "@/common/http/base-controller";

import type { PaginationQuery } from "@/common/types";
import type { ClientService } from "./client.service";
import type { CreateClientInput } from "./client.types";

export class ClientController extends BaseController {
	constructor(private readonly service: ClientService) {
		super();
	}

	async getAll(query: PaginationQuery, storeId: string) {
		const { page = 1, limit = 10 } = query;

		const result = await this.service.getAllClients(page, limit, storeId);

		return result.match((data) => ({ data }), this.handleError);
	}

	async create(data: CreateClientInput) {
		const result = await this.service.createClient(data);

		return result.match((data) => ({ data, status: 201 }), this.handleError);
	}

	async delete(id: string) {
		const result = await this.service.deleteClient(id);

		return result.match(() => ({ status: 204 }), this.handleError);
	}
}
