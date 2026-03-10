import { and, eq, isNull } from "drizzle-orm";
import { err, ok } from "neverthrow";

import { NotFoundError } from "@/common/errors";
import { getTableCount, wrapDatabaseOperation } from "@/common/utils/database";
import { db } from "@/db";
import { stores } from "@/db/schema";

import type { IStoreRepository } from "./store.repository.interface";
import type { CreateStoreInput, UpdateStoreInput } from "./store.types";

export class StoreRepository implements IStoreRepository {
	async findAll(page: number, limit: number) {
		return wrapDatabaseOperation(async () => {
			const offset = (page - 1) * limit;
			const notDeleted = isNull(stores.deletedAt);

			const [items, total] = await Promise.all([
				db.select().from(stores).where(notDeleted).limit(limit).offset(offset),
				getTableCount(stores, notDeleted),
			]);

			return { items, total };
		}, "Failed to fetch stores");
	}

	async findById(id: string) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.select()
					.from(stores)
					.where(and(eq(stores.id, id), isNull(stores.deletedAt))),
			"Failed to fetch store",
		);

		return result.andThen(([store]) => {
			if (!store) {
				return err(new NotFoundError("Store", id));
			}

			return ok(store);
		});
	}

	async create(data: CreateStoreInput) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.insert(stores)
					.values({
						name: data.name,
						taxId: data.taxId,
						email: data.email,
						cellphone: data.cellphone,
					})
					.returning(),
			"Failed to create store",
		);

		return result.map(([store]) => store);
	}

	async update(id: string, data: UpdateStoreInput) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.update(stores)
					.set({
						...data,
						updatedAt: new Date(),
					})
					.where(and(eq(stores.id, id), isNull(stores.deletedAt)))
					.returning(),
			"Failed to update store",
		);

		return result.andThen(([store]) => {
			if (!store) {
				return err(new NotFoundError("Store", id));
			}

			return ok(store);
		});
	}

	async delete(id: string) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.update(stores)
					.set({
						deletedAt: new Date(),
						updatedAt: new Date(),
					})
					.where(and(eq(stores.id, id), isNull(stores.deletedAt)))
					.returning(),
			"Failed to delete store",
		);

		return result.andThen(([store]) => {
			if (!store) {
				return err(new NotFoundError("Store", id));
			}

			return ok(undefined);
		});
	}
}
