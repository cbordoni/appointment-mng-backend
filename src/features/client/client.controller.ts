import { BaseController } from "@/common/http/base-controller";
import type { PaginationQuery } from "@/common/types";

import type { ClientService } from "./client.service";
import type { CreateClientInput, UpdateClientInput } from "./client.types";

export class ClientController extends BaseController {
	constructor(private readonly service: ClientService) {
		super();
	}

	async getAll(query: PaginationQuery) {
		const { page = 1, limit = 10 } = query;

		return (await this.service.getAllClients(page, limit)).match(
			(data) => ({ data }),
			this.handleError,
		);
	}

	async getById(id: string) {
		return (await this.service.getClientById(id)).match(
			(data) => ({ data }),
			this.handleError,
		);
	}

	async create(data: CreateClientInput) {
		return (await this.service.createClient(data)).match(
			(data) => ({ data, status: 201 }),
			this.handleError,
		);
	}

	async update(id: string, data: UpdateClientInput) {
		return (await this.service.updateClient(id, data)).match(
			(data) => ({ data }),
			this.handleError,
		);
	}

	async delete(id: string) {
		return (await this.service.deleteClient(id)).match(
			() => ({ status: 204 }),
			this.handleError,
		);
	}
}
