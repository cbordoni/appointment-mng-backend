import { eq } from "drizzle-orm";
import { err, ok } from "neverthrow";

import { NotFoundError } from "@/common/errors";
import { getTableCount, wrapDatabaseOperation } from "@/common/utils/database";
import { db } from "@/db";
import { users } from "@/db/schema";

import type { IUserRepository } from "./user.repository.interface";
import type { CreateUserInput, UpdateUserInput } from "./user.types";

export class UserRepository implements IUserRepository {
	async findAll(page: number, limit: number) {
		return wrapDatabaseOperation(async () => {
			const offset = (page - 1) * limit;

			const [items, total] = await Promise.all([
				db.select().from(users).limit(limit).offset(offset),
				getTableCount(users),
			]);

			return { items, total };
		}, "Failed to fetch users");
	}

	async findById(id: string) {
		const result = await wrapDatabaseOperation(
			() => db.select().from(users).where(eq(users.id, id)),
			"Failed to fetch user",
		);

		return result.andThen(([user]) => {
			if (!user) {
				return err(new NotFoundError("User", id));
			}

			return ok(user);
		});
	}

	async exists(id: string) {
		const result = await wrapDatabaseOperation(
			() => db.select({ id: users.id }).from(users).where(eq(users.id, id)),
			"Failed to check user existence",
		);

		return result.map(([user]) => !!user);
	}

	async findByEmail(email: string) {
		const result = await wrapDatabaseOperation(
			() => db.select().from(users).where(eq(users.email, email)),
			"Failed to fetch user by email",
		);

		return result.andThen(([user]) => {
			if (!user) {
				return err(new NotFoundError("User", email));
			}

			return ok(user);
		});
	}

	async create(data: CreateUserInput) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.insert(users)
					.values({
						name: data.name,
						email: data.email,
						cellphone: data.cellphone,
						role: data.role,
					})
					.returning(),
			"Failed to create user",
		);

		return result.map(([user]) => user);
	}

	async update(id: string, data: UpdateUserInput) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.update(users)
					.set({
						...data,
						updatedAt: new Date(),
					})
					.where(eq(users.id, id))
					.returning(),
			"Failed to update user",
		);

		return result.andThen(([user]) => {
			if (!user) {
				return err(new NotFoundError("User", id));
			}

			return ok(user);
		});
	}

	async delete(id: string) {
		const result = await wrapDatabaseOperation(
			() => db.delete(users).where(eq(users.id, id)).returning(),
			"Failed to delete user",
		);

		return result.andThen(([user]) => {
			if (!user) {
				return err(new NotFoundError("User", id));
			}

			return ok(undefined);
		});
	}
}
