import { and, eq, isNull } from "drizzle-orm";
import { err, ok } from "neverthrow";

import { NotFoundError } from "@/common/errors";
import { wrapDatabaseOperation } from "@/common/utils/database";
import { db } from "@/db";
import { accounts, clients } from "@/db/schema";

import type { IClientRepository } from "./client.repository.interface";
import type { CreateClientInput } from "./client.types";

export class ClientRepository implements IClientRepository {
	async findAll(page: number, limit: number, storeId: string) {
		return wrapDatabaseOperation(async () => {
			const offset = (page - 1) * limit;
			const notDeleted = isNull(clients.deletedAt);

			const [items, total] = await Promise.all([
				db
					.select({
						id: accounts.id,
						name: accounts.name,
						cellphone: accounts.cellphone,
					})
					.from(clients)
					.innerJoin(accounts, eq(clients.accountId, accounts.id))
					.where(and(notDeleted, eq(accounts.storeId, storeId)))
					.limit(limit)
					.offset(offset),
				db
					.select({ id: clients.id })
					.from(clients)
					.innerJoin(accounts, eq(clients.accountId, accounts.id))
					.where(and(notDeleted, eq(accounts.storeId, storeId)))
					.then((rows) => rows.length),
			]);

			return {
				items,
				total,
			};
		}, "Failed to fetch clients");
	}

	async exists(id: string) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.select({ id: clients.id })
					.from(clients)
					.where(and(eq(clients.id, id), isNull(clients.deletedAt))),
			"Failed to check client existence",
		);

		return result.map(([client]) => !!client);
	}

	async create(data: CreateClientInput) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.insert(clients)
					.values({
						accountId: data.accountId,
						deletedAt: null,
					})
					.returning(),
			"Failed to create client",
		);

		return result.map(([client]) => client);
	}

	async delete(id: string) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.update(clients)
					.set({
						deletedAt: new Date(),
						updatedAt: new Date(),
					})
					.where(and(eq(clients.id, id), isNull(clients.deletedAt)))
					.returning(),
			"Failed to delete client",
		);

		return result.andThen(([client]) => {
			if (!client) {
				return err(new NotFoundError("Client", id));
			}

			return ok(undefined);
		});
	}
}
