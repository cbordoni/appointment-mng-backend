import { err, ok } from "neverthrow";

import { NotFoundError } from "@/common/errors";
import type { Account, Client } from "@/db/schema";

import type {
	ClientListItem,
	IClientRepository,
} from "./client.repository.interface";
import type { CreateClientInput } from "./client.types";

export class MockClientRepository implements IClientRepository {
	private items: Client[] = [];

	private accountsMap: Map<string, Account> = new Map();

	async findAll(page: number, limit: number, storeId: string) {
		const activeClients = this.items.filter((client) => !client.deletedAt);

		const filteredClients = activeClients.filter((client) => {
			const account = this.accountsMap.get(client.accountId);

			return account?.storeId === storeId;
		});

		const offset = (page - 1) * limit;
		const clientsData = filteredClients.slice(offset, offset + limit);

		const items: ClientListItem[] = clientsData
			.map((client) => this.accountsMap.get(client.accountId))
			.filter((account) => account !== undefined)
			.map((account) => ({
				id: account.id,
				name: account.name,
				cellphone: account.cellphone,
			})) as ClientListItem[];

		return ok({
			items,
			total: filteredClients.length,
		});
	}

	async findById(id: string) {
		const client = this.items.find((item) => item.id === id && !item.deletedAt);

		if (!client) {
			return err(new NotFoundError("Client", id));
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
			accountId: data.accountId,
			deletedAt: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		this.items.push(client);

		return ok(client);
	}

	async delete(id: string) {
		const index = this.items.findIndex(
			(client) => client.id === id && !client.deletedAt,
		);

		if (index === -1) {
			return err(new NotFoundError("Client", id));
		}

		const currentClient = this.items[index];
		const updated: Client = {
			...currentClient,
			deletedAt: new Date(),
			updatedAt: new Date(),
		};

		this.items[index] = updated;

		return ok(undefined);
	}

	setClients(clients: Client[]): void {
		this.items = clients;
	}

	clearClients(): void {
		this.items = [];
	}

	setAccounts(accounts: Account[]): void {
		this.accountsMap.clear();
		accounts.forEach((account) => {
			this.accountsMap.set(account.id, account);
		});
	}

	clearAccounts(): void {
		this.accountsMap.clear();
	}
}
