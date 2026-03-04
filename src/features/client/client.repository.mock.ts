import { ok, type Result } from "neverthrow";

import type { NotFoundError } from "@/common/errors";
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
		return super.findAll(page, limit);
	}

	async exists(id: string) {
		const clientExists = this.items.some((client) => client.id === id);

		return ok(clientExists);
	}

	async create(data: CreateClientInput) {
		const client: Client = {
			id: crypto.randomUUID(),
			name: data.name,
			cellphone: data.cellphone,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		this.items.push(client);

		return ok(client);
	}

	private async updateClientAtIndex(
		id: string,
		updater: (client: Client) => Client,
	) {
		const indexResult = await this.findIndexById(id);

		if (indexResult.isErr()) {
			return indexResult as Result<never, NotFoundError>;
		}

		const index = indexResult.value;
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

	// Alias helper methods for testing
	setClients(clients: Client[]) {
		this.setItems(clients);
	}

	clearClients() {
		this.clearItems();
	}
}
