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

		return (await this.service.getAllUsers(page, limit)).match(
			(data) => ({ data }),
			this.handleError,
		);
	}

	async getById(id: string) {
		return (await this.service.getUserById(id)).match(
			(data) => ({ data }),
			this.handleError,
		);
	}

	async create(data: CreateUserInput) {
		return (await this.service.createUser(data)).match(
			(data) => ({ data, status: 201 }),
			this.handleError,
		);
	}

	async update(id: string, data: UpdateUserInput) {
		return (await this.service.updateUser(id, data)).match(
			(data) => ({ data }),
			this.handleError,
		);
	}

	async delete(id: string) {
		return (await this.service.deleteUser(id)).match(
			() => ({ status: 204 }),
			this.handleError,
		);
	}
}
