import { BaseController } from "@/common/http/base-controller";
import type { PaginationQuery } from "@/common/types";

import type { AccountService } from "./account.service";
import type { CreateAccountInput, UpdateAccountInput } from "./account.types";

export class AccountController extends BaseController {
	constructor(private readonly service: AccountService) {
		super();
	}

	async getAll(query: PaginationQuery, storeId: string) {
		const { page = 1, limit = 10 } = query;

		const result = await this.service.getAllAccounts(page, limit, storeId);

		return result.match((data) => ({ data }), this.handleError);
	}

	async getById(id: string) {
		const result = await this.service.getAccountById(id);

		return result.match((data) => ({ data }), this.handleError);
	}

	async create(data: CreateAccountInput) {
		const result = await this.service.createAccount(data);

		return result.match((data) => ({ data, status: 201 }), this.handleError);
	}

	async update(id: string, data: UpdateAccountInput) {
		const result = await this.service.updateAccount(id, data);

		return result.match((data) => ({ data }), this.handleError);
	}

	async delete(id: string) {
		const result = await this.service.deleteAccount(id);

		return result.match(() => ({ status: 204 }), this.handleError);
	}
}
