import { ok, type Result } from "neverthrow";

import type { NotFoundError } from "@/common/errors";
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

	async findAll(page: number, limit: number) {
		return super.findAll(page, limit);
	}

	async exists(id: string) {
		const professionalExists = this.items.some(
			(professional) => professional.id === id,
		);

		return ok(professionalExists);
	}

	async create(data: CreateProfessionalInput) {
		const professional: Professional = {
			id: crypto.randomUUID(),
			name: data.name,
			taxId: data.taxId,
			phone: data.phone,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		this.items.push(professional);

		return ok(professional);
	}

	private async updateProfessionalAtIndex(
		id: string,
		updater: (professional: Professional) => Professional,
	) {
		const indexResult = await this.findIndexById(id);

		if (indexResult.isErr()) {
			return indexResult as Result<never, NotFoundError>;
		}

		const index = indexResult.value;
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

	setProfessionals(professionals: Professional[]) {
		this.setItems(professionals);
	}

	clearProfessionals() {
		this.clearItems();
	}
}
