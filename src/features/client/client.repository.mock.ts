import { err, ok, type Result } from "neverthrow";

import { type DatabaseError, NotFoundError } from "@/common/errors";
import type { Client } from "@/db/schema";
import { BaseInMemoryRepository } from "@/testing/base-in-memory-repository";

import type { IClientRepository } from "./client.repository.interface";
import type { CreateClientInput, UpdateClientInput } from "./client.types";

export class MockClientRepository
	extends BaseInMemoryRepository<Client>
	implements IClientRepository
{
	protected get entityName(): string {
		return "Client";
	}

	async findAll(page: number, limit: number) {
		const activeClients = this.items.filter((client) => !client.deletedAt);
		const offset = (page - 1) * limit;
		const data = activeClients.slice(offset, offset + limit);

		return ok({
			items: data,
			total: activeClients.length,
		});
	}

	async findById(id: string) {
		const client = this.items.find((item) => item.id === id && !item.deletedAt);

		if (!client) {
			return err(new NotFoundError(this.entityName, id));
		}

		return ok(client);
	}

	async exists(id: string) {
		const clientExists = this.items.some(
			(client) => client.id === id && !client.deletedAt,
		);

		return ok(clientExists);
	}

	async create(data: CreateClientInput) {
		const client: Client = {
			id: crypto.randomUUID(),
			name: data.name,
			taxId: data.taxId ?? null,
			cellphone: data.cellphone,
			deletedAt: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		this.items.push(client);

		return ok(client);
	}

	private async updateClientAtIndex(
		id: string,
		updater: (client: Client) => Client,
	): Promise<Result<Client, NotFoundError | DatabaseError>> {
		const index = this.items.findIndex(
			(client) => client.id === id && !client.deletedAt,
		);

		if (index === -1) {
			return err(new NotFoundError(this.entityName, id));
		}

		const currentClient = this.items[index];
		const updated = updater(currentClient);

		this.items[index] = updated;

		return ok(updated);
	}

	async update(id: string, data: UpdateClientInput) {
		return this.updateClientAtIndex(id, (currentClient) => ({
			...currentClient,
			...data,
			updatedAt: new Date(),
		}));
	}

	async delete(id: string) {
		const result = await this.updateClientAtIndex(id, (currentClient) => ({
			...currentClient,
			deletedAt: new Date(),
			updatedAt: new Date(),
		}));

		if (result.isErr()) {
			return err(result.error);
		}

		return ok(undefined);
	}

	// Alias helper methods for testing
	setClients(clients: Client[]) {
		this.setItems(clients);
	}

	clearClients() {
		this.clearItems();
	}
}
