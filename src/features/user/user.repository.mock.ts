import { ok, type Result } from "neverthrow";

import type { NotFoundError } from "@/common/errors";
import type { User } from "@/db/schema";
import { BaseInMemoryRepository } from "@/testing/base-in-memory-repository";

import type { IUserRepository } from "./user.repository.interface";
import type { CreateUserInput, UpdateUserInput } from "./user.types";

export class MockUserRepository
	extends BaseInMemoryRepository<User>
	implements IUserRepository
{
	protected get entityName(): string {
		return "User";
	}

	async findAll(page: number, limit: number) {
		return super.findAll(page, limit);
	}

	async exists(id: string) {
		const userExists = this.items.some((user) => user.id === id);

		return ok(userExists);
	}

	async findByEmail(email: string) {
		return this.findByPredicate((user) => user.email === email, email);
	}

	async create(data: CreateUserInput) {
		const user: User = {
			id: crypto.randomUUID(),
			name: data.name,
			email: data.email,
			cellphone: data.cellphone,
			role: data.role ?? "customer",
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		this.items.push(user);

		return ok(user);
	}

	private async updateUserAtIndex(id: string, updater: (user: User) => User) {
		const indexResult = await this.findIndexById(id);

		if (indexResult.isErr()) {
			return indexResult as Result<never, NotFoundError>;
		}

		const index = indexResult.value;
		const currentUser = this.items[index];
		const updated = updater(currentUser);

		this.items[index] = updated;

		return ok(updated);
	}

	async update(id: string, data: UpdateUserInput) {
		return this.updateUserAtIndex(id, (currentUser) => ({
			...currentUser,
			...data,
			updatedAt: new Date(),
		}));
	}

	// Alias helper methods for testing
	setUsers(users: User[]) {
		this.setItems(users);
	}

	clearUsers() {
		this.clearItems();
	}
}
