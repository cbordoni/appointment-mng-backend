import { err, ok, type Result } from "neverthrow";

import { type DatabaseError, NotFoundError } from "@/common/errors";
import type { PaginatedResult } from "@/common/types";

export abstract class BaseInMemoryRepository<T extends { id: string }> {
	protected items: T[] = [];

	protected abstract get entityName(): string;

	async findAll(
		page: number,
		limit: number,
	): Promise<Result<PaginatedResult<T>, DatabaseError>> {
		const offset = (page - 1) * limit;
		const data = this.items.slice(offset, offset + limit);

		return ok({ items: data, total: this.items.length });
	}

	async findById(
		id: string,
	): Promise<Result<T, NotFoundError | DatabaseError>> {
		const item = this.items.find((i) => i.id === id);

		if (!item) {
			return err(new NotFoundError(this.entityName, id));
		}

		return ok(item);
	}

	async delete(
		id: string,
	): Promise<Result<void, NotFoundError | DatabaseError>> {
		const index = this.items.findIndex((i) => i.id === id);

		if (index === -1) {
			return err(new NotFoundError(this.entityName, id));
		}

		this.items.splice(index, 1);

		return ok(undefined);
	}

	protected async findIndexById(
		id: string,
	): Promise<Result<number, NotFoundError>> {
		const index = this.items.findIndex((i) => i.id === id);

		if (index === -1) {
			return err(new NotFoundError(this.entityName, id));
		}

		return ok(index);
	}

	protected async findByPredicate(
		predicate: (item: T) => boolean,
		identifier: string,
	): Promise<Result<T, NotFoundError>> {
		const item = this.items.find(predicate);

		if (!item) {
			return err(new NotFoundError(this.entityName, identifier));
		}

		return ok(item);
	}

	// Helper methods for testing
	setItems(items: T[]) {
		this.items = items;
	}

	clearItems() {
		this.items = [];
	}
}
