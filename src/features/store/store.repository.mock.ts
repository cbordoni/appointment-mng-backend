import { err, ok, type Result } from "neverthrow";

import { type DatabaseError, NotFoundError } from "@/common/errors";
import type { Store } from "@/db/schema";
import { BaseInMemoryRepository } from "@/testing/base-in-memory-repository";

import type { IStoreRepository } from "./store.repository.interface";
import type { CreateStoreInput, UpdateStoreInput } from "./store.types";

export class MockStoreRepository
	extends BaseInMemoryRepository<Store>
	implements IStoreRepository
{
	public existingStoreIds: Set<string> = new Set();

	public setExistingStoreIds(ids: string[]) {
		this.existingStoreIds = new Set(ids);
	}

	protected get entityName(): string {
		return "Store";
	}

	async findAll(page: number, limit: number) {
		const activeStores = this.items.filter((store) => !store.deletedAt);
		const offset = (page - 1) * limit;
		const data = activeStores.slice(offset, offset + limit);

		return ok({
			items: data,
			total: activeStores.length,
		});
	}

	async findById(id: string) {
		const store = this.items.find((item) => item.id === id && !item.deletedAt);

		if (!store) {
			return err(new NotFoundError(this.entityName, id));
		}

		return ok(store);
	}

	async exists(id: string) {
		if (this.existingStoreIds.size > 0) {
			return ok(this.existingStoreIds.has(id));
		}

		const storeExists = this.items.some(
			(store) => store.id === id && !store.deletedAt,
		);

		return ok(storeExists);
	}

	async create(data: CreateStoreInput) {
		const store: Store = {
			id: crypto.randomUUID(),
			name: data.name,
			taxId: data.taxId ?? null,
			email: data.email ?? "store@email.com",
			cellphone: data.cellphone ?? "11999999999",
			deletedAt: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		this.items.push(store);

		return ok(store);
	}

	private async updateStoreAtIndex(
		id: string,
		updater: (store: Store) => Store,
	): Promise<Result<Store, NotFoundError | DatabaseError>> {
		const index = this.items.findIndex(
			(store) => store.id === id && !store.deletedAt,
		);

		if (index === -1) {
			return err(new NotFoundError(this.entityName, id));
		}

		const currentStore = this.items[index];
		const updated = updater(currentStore);

		this.items[index] = updated;

		return ok(updated);
	}

	async update(id: string, data: UpdateStoreInput) {
		return this.updateStoreAtIndex(id, (currentStore) => ({
			...currentStore,
			...data,
			updatedAt: new Date(),
		}));
	}

	async delete(id: string) {
		const result = await this.updateStoreAtIndex(id, (currentStore) => ({
			...currentStore,
			deletedAt: new Date(),
			updatedAt: new Date(),
		}));

		if (result.isErr()) {
			return err(result.error);
		}

		return ok(undefined);
	}

	setStores(stores: Store[]) {
		this.setItems(stores);
	}

	clearStores() {
		this.clearItems();
	}
}
