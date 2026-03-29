import { err, ok, type Result } from "neverthrow";

import { type DatabaseError, NotFoundError } from "@/common/errors";
import type { Professional } from "@/db/schema";
import { BaseInMemoryRepository } from "@/testing/base-in-memory-repository";

import type { IProfessionalRepository } from "./professional.repository.interface";
import type {
	CreateProfessionalInput,
	UpdateProfessionalInput,
} from "./professional.types";

export class MockProfessionalRepository
	extends BaseInMemoryRepository<Professional>
	implements IProfessionalRepository
{
	protected get entityName(): string {
		return "Professional";
	}

	async findAll(page: number, limit: number, _storeId: string) {
		const activeProfessionals = this.items.filter(
			(professional) => !professional.deletedAt,
		);
		const offset = (page - 1) * limit;
		const data = activeProfessionals.slice(offset, offset + limit);

		return ok({
			items: data,
			total: activeProfessionals.length,
		});
	}

	async findById(id: string) {
		const professional = this.items.find(
			(item) => item.id === id && !item.deletedAt,
		);

		if (!professional) {
			return err(new NotFoundError(this.entityName, id));
		}

		return ok(professional);
	}

	async exists(id: string) {
		const professionalExists = this.items.some(
			(professional) => professional.id === id && !professional.deletedAt,
		);

		return ok(professionalExists);
	}

	async create(data: CreateProfessionalInput) {
		const professional: Professional = {
			id: crypto.randomUUID(),
			accountId: data.accountId,
			deletedAt: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		this.items.push(professional);

		return ok(professional);
	}

	private async updateProfessionalAtIndex(
		id: string,
		updater: (professional: Professional) => Professional,
	): Promise<Result<Professional, NotFoundError | DatabaseError>> {
		const index = this.items.findIndex(
			(professional) => professional.id === id && !professional.deletedAt,
		);

		if (index === -1) {
			return err(new NotFoundError(this.entityName, id));
		}

		const currentProfessional = this.items[index];
		const updated = updater(currentProfessional);

		this.items[index] = updated;

		return ok(updated);
	}

	async update(id: string, data: UpdateProfessionalInput) {
		return this.updateProfessionalAtIndex(id, (currentProfessional) => ({
			...currentProfessional,
			...data,
			updatedAt: new Date(),
		}));
	}

	async delete(id: string) {
		const result = await this.updateProfessionalAtIndex(
			id,
			(currentProfessional) => ({
				...currentProfessional,
				deletedAt: new Date(),
				updatedAt: new Date(),
			}),
		);

		if (result.isErr()) {
			return err(result.error);
		}

		return ok(undefined);
	}

	setProfessionals(professionals: Professional[]) {
		this.setItems(professionals);
	}

	clearProfessionals() {
		this.clearItems();
	}
}
