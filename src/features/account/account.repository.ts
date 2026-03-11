import { and, eq, isNull } from "drizzle-orm";
import { err, ok } from "neverthrow";

import { NotFoundError } from "@/common/errors";
import { getTableCount, wrapDatabaseOperation } from "@/common/utils/database";
import { db } from "@/db";
import { accounts } from "@/db/schema";

import type { IAccountRepository } from "./account.repository.interface";
import type {
	CreateAccountRepositoryInput,
	UpdateAccountRepositoryInput,
} from "./account.types";

export class AccountRepository implements IAccountRepository {
	async findAll(page: number, limit: number, storeId: string) {
		return wrapDatabaseOperation(async () => {
			const offset = (page - 1) * limit;
			const notDeleted = isNull(accounts.deletedAt);

			const [items, total] = await Promise.all([
				db
					.select()
					.from(accounts)
					.where(and(eq(accounts.storeId, storeId), notDeleted))
					.limit(limit)
					.offset(offset),
				getTableCount(accounts, and(eq(accounts.storeId, storeId), notDeleted)),
			]);

			return { items, total };
		}, "Failed to fetch accounts");
	}

	async findById(id: string) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.select()
					.from(accounts)
					.where(and(eq(accounts.id, id), isNull(accounts.deletedAt))),
			"Failed to fetch account",
		);

		return result.andThen(([account]) => {
			if (!account) {
				return err(new NotFoundError("Account", id));
			}

			return ok(account);
		});
	}

	async exists(id: string) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.select({ id: accounts.id })
					.from(accounts)
					.where(and(eq(accounts.id, id), isNull(accounts.deletedAt))),
			"Failed to check account existence",
		);

		return result.map(([account]) => !!account);
	}

	async create(data: CreateAccountRepositoryInput) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.insert(accounts)
					.values({
						name: data.name,
						taxId: data.taxId,
						cellphone: data.cellphone,
						passwordHash: data.passwordHash,
						storeId: data.storeId,
						deletedAt: null,
					})
					.returning(),
			"Failed to create account",
		);

		return result.map(([account]) => account);
	}

	async update(id: string, data: UpdateAccountRepositoryInput) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.update(accounts)
					.set({
						...data,
						updatedAt: new Date(),
					})
					.where(and(eq(accounts.id, id), isNull(accounts.deletedAt)))
					.returning(),
			"Failed to update account",
		);

		return result.andThen(([account]) => {
			if (!account) {
				return err(new NotFoundError("Account", id));
			}

			return ok(account);
		});
	}

	async delete(id: string) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.update(accounts)
					.set({
						deletedAt: new Date(),
						updatedAt: new Date(),
					})
					.where(and(eq(accounts.id, id), isNull(accounts.deletedAt)))
					.returning(),
			"Failed to delete account",
		);

		return result.andThen(([account]) => {
			if (!account) {
				return err(new NotFoundError("Account", id));
			}

			return ok(undefined);
		});
	}
}
