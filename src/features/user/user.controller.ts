import { BaseController } from "@/common/http/base-controller";
import type { PaginationQuery } from "@/common/types";

import type { UserService } from "./user.service";
import type { CreateUserInput, UpdateUserInput } from "./user.types";

export class UserController extends BaseController {
	constructor(private readonly service: UserService) {
		super();
	}

	async getAll(query: PaginationQuery) {
		const { page = 1, limit = 10 } = query;

		const result = await this.service.getAllUsers(page, limit);

		return result.match((paginatedData) => paginatedData, this.handleError);
	}

	async getById(id: string) {
		const result = await this.service.getUserById(id);

		return result.match((user) => ({ data: user }), this.handleError);
	}

	async create(data: CreateUserInput) {
		const result = await this.service.createUser(data);

		return result.match(
			(user) => ({ data: user, status: 201 }),
			this.handleError,
		);
	}

	async update(id: string, data: UpdateUserInput) {
		const result = await this.service.updateUser(id, data);

		return result.match((user) => ({ data: user }), this.handleError);
	}

	async delete(id: string) {
		const result = await this.service.deleteUser(id);

		return result.match(() => ({ status: 204 }), this.handleError);
	}
}
