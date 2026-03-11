import { err, ok, type Result } from "neverthrow";

import { type DatabaseError, NotFoundError } from "@/common/errors";
import type { Account } from "@/db/schema";
import { BaseInMemoryRepository } from "@/testing/base-in-memory-repository";

import type { IAccountRepository } from "./account.repository.interface";
import type {
	CreateAccountRepositoryInput,
	UpdateAccountRepositoryInput,
} from "./account.types";

export class MockAccountRepository
	extends BaseInMemoryRepository<Account>
	implements IAccountRepository
{
	protected get entityName(): string {
		return "Account";
	}

	async findAll(page: number, limit: number, storeId: string) {
		const activeAccounts = this.items.filter(
			(account) => account.storeId === storeId && !account.deletedAt,
		);
		const offset = (page - 1) * limit;
		const data = activeAccounts.slice(offset, offset + limit);

		return ok({
			items: data,
			total: activeAccounts.length,
		});
	}

	async findById(id: string) {
		const account = this.items.find(
			(item) => item.id === id && !item.deletedAt,
		);

		if (!account) {
			return err(new NotFoundError(this.entityName, id));
		}

		return ok(account);
	}

	async exists(id: string) {
		const accountExists = this.items.some(
			(account) => account.id === id && !account.deletedAt,
		);

		return ok(accountExists);
	}

	async create(data: CreateAccountRepositoryInput) {
		const account: Account = {
			id: crypto.randomUUID(),
			name: data.name,
			taxId: data.taxId ?? null,
			cellphone: data.cellphone,
			passwordHash: data.passwordHash,
			storeId: data.storeId,
			deletedAt: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		this.items.push(account);

		return ok(account);
	}

	private async updateAccountAtIndex(
		id: string,
		updater: (account: Account) => Account,
	): Promise<Result<Account, NotFoundError | DatabaseError>> {
		const index = this.items.findIndex(
			(account) => account.id === id && !account.deletedAt,
		);

		if (index === -1) {
			return err(new NotFoundError(this.entityName, id));
		}

		const currentAccount = this.items[index];
		const updated = updater(currentAccount);

		this.items[index] = updated;

		return ok(updated);
	}

	async update(id: string, data: UpdateAccountRepositoryInput) {
		return this.updateAccountAtIndex(id, (currentAccount) => ({
			...currentAccount,
			...data,
			updatedAt: new Date(),
		}));
	}

	async delete(id: string) {
		const result = await this.updateAccountAtIndex(id, (currentAccount) => ({
			...currentAccount,
			deletedAt: new Date(),
			updatedAt: new Date(),
		}));

		if (result.isErr()) {
			return err(result.error);
		}

		return ok(undefined);
	}

	setAccounts(accounts: Account[]) {
		this.setItems(accounts);
	}

	clearAccounts() {
		this.clearItems();
	}
}
