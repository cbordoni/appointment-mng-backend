import { eq } from "drizzle-orm";
import { err, ok } from "neverthrow";

import { NotFoundError } from "@/common/errors";
import { getTableCount, wrapDatabaseOperation } from "@/common/utils/database";
import { db } from "@/db";
import { professionals } from "@/db/schema";

import type { IProfessionalRepository } from "./professional.repository.interface";
import type {
	CreateProfessionalInput,
	UpdateProfessionalInput,
} from "./professional.types";

export class ProfessionalRepository implements IProfessionalRepository {
	async findAll(page: number, limit: number) {
		return wrapDatabaseOperation(async () => {
			const offset = (page - 1) * limit;

			const [items, total] = await Promise.all([
				db.select().from(professionals).limit(limit).offset(offset),
				getTableCount(professionals),
			]);

			return { items, total };
		}, "Failed to fetch professionals");
	}

	async findById(id: string) {
		const result = await wrapDatabaseOperation(
			() => db.select().from(professionals).where(eq(professionals.id, id)),
			"Failed to fetch professional",
		);

		return result.andThen(([professional]) => {
			if (!professional) {
				return err(new NotFoundError("Professional", id));
			}

			return ok(professional);
		});
	}

	async exists(id: string) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.select({ id: professionals.id })
					.from(professionals)
					.where(eq(professionals.id, id)),
			"Failed to check professional existence",
		);

		return result.map(([professional]) => !!professional);
	}

	async create(data: CreateProfessionalInput) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.insert(professionals)
					.values({
						name: data.name,
						taxId: data.taxId,
						cellphone: data.cellphone,
					})
					.returning(),
			"Failed to create professional",
		);

		return result.map(([professional]) => professional);
	}

	async update(id: string, data: UpdateProfessionalInput) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.update(professionals)
					.set({
						...data,
						updatedAt: new Date(),
					})
					.where(eq(professionals.id, id))
					.returning(),
			"Failed to update professional",
		);

		return result.andThen(([professional]) => {
			if (!professional) {
				return err(new NotFoundError("Professional", id));
			}

			return ok(professional);
		});
	}

	async delete(id: string) {
		const result = await wrapDatabaseOperation(
			() =>
				db.delete(professionals).where(eq(professionals.id, id)).returning(),
			"Failed to delete professional",
		);

		return result.andThen(([professional]) => {
			if (!professional) {
				return err(new NotFoundError("Professional", id));
			}

			return ok(undefined);
		});
	}
}
