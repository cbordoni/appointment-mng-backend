import { BaseController } from "@/common/http/base-controller";
import type { SimplePaginationQuery } from "@/common/types";

import type { StoreService } from "./store.service";
import type { CreateStoreInput, UpdateStoreInput } from "./store.types";

export class StoreController extends BaseController {
	constructor(private readonly service: StoreService) {
		super();
	}

	async getAll(query: SimplePaginationQuery) {
		const { page = 1, limit = 10 } = query;

		const result = await this.service.getAllStores(page, limit);

		return result.match((data) => ({ data }), this.handleError);
	}

	async getById(id: string) {
		const result = await this.service.getStoreById(id);

		return result.match((data) => ({ data }), this.handleError);
	}

	async create(data: CreateStoreInput) {
		const result = await this.service.createStore(data);

		return result.match((data) => ({ data, status: 201 }), this.handleError);
	}

	async update(id: string, data: UpdateStoreInput) {
		const result = await this.service.updateStore(id, data);

		return result.match((data) => ({ data }), this.handleError);
	}

	async delete(id: string) {
		const result = await this.service.deleteStore(id);

		return result.match(() => ({ status: 204 }), this.handleError);
	}
}
