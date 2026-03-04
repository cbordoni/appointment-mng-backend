import { and, eq, isNull } from "drizzle-orm";
import { err, ok } from "neverthrow";

import { NotFoundError } from "@/common/errors";
import { getTableCount, wrapDatabaseOperation } from "@/common/utils/database";
import { db } from "@/db";
import { clients } from "@/db/schema";

import type { IClientRepository } from "./client.repository.interface";
import type { CreateClientInput, UpdateClientInput } from "./client.types";

export class ClientRepository implements IClientRepository {
	async findAll(page: number, limit: number) {
		return wrapDatabaseOperation(async () => {
			const offset = (page - 1) * limit;
			const notDeleted = isNull(clients.deletedAt);

			const [items, total] = await Promise.all([
				db.select().from(clients).where(notDeleted).limit(limit).offset(offset),
				getTableCount(clients, notDeleted),
			]);

			return { items, total };
		}, "Failed to fetch clients");
	}

	async findById(id: string) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.select()
					.from(clients)
					.where(and(eq(clients.id, id), isNull(clients.deletedAt))),
			"Failed to fetch client",
		);

		return result.andThen(([client]) => {
			if (!client) {
				return err(new NotFoundError("Client", id));
			}

			return ok(client);
		});
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
						name: data.name,
						cellphone: data.cellphone,
						taxId: data.taxId,
						deletedAt: null,
					})
					.returning(),
			"Failed to create client",
		);

		return result.map(([client]) => client);
	}

	async update(id: string, data: UpdateClientInput) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.update(clients)
					.set({
						...data,
						updatedAt: new Date(),
					})
					.where(and(eq(clients.id, id), isNull(clients.deletedAt)))
					.returning(),
			"Failed to update client",
		);

		return result.andThen(([client]) => {
			if (!client) {
				return err(new NotFoundError("Client", id));
			}

			return ok(client);
		});
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
