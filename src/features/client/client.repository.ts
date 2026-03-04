import { eq } from "drizzle-orm";
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

			const [items, total] = await Promise.all([
				db.select().from(clients).limit(limit).offset(offset),
				getTableCount(clients),
			]);

			return { items, total };
		}, "Failed to fetch clients");
	}

	async findById(id: string) {
		const result = await wrapDatabaseOperation(
			() => db.select().from(clients).where(eq(clients.id, id)),
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
				db.select({ id: clients.id }).from(clients).where(eq(clients.id, id)),
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
					.where(eq(clients.id, id))
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
			() => db.delete(clients).where(eq(clients.id, id)).returning(),
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
