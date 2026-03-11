import { and, eq, isNull } from "drizzle-orm";
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
	async findAll(page: number, limit: number, storeId: string) {
		return wrapDatabaseOperation(async () => {
			const offset = (page - 1) * limit;
			const notDeleted = isNull(professionals.deletedAt);

			const [items, total] = await Promise.all([
				db
					.select()
					.from(professionals)
					.where(and(eq(professionals.storeId, storeId), notDeleted))
					.limit(limit)
					.offset(offset),
				getTableCount(
					professionals,
					and(eq(professionals.storeId, storeId), notDeleted),
				),
			]);

			return { items, total };
		}, "Failed to fetch professionals");
	}

	async findById(id: string) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.select()
					.from(professionals)
					.where(
						and(eq(professionals.id, id), isNull(professionals.deletedAt)),
					),
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
					.where(
						and(eq(professionals.id, id), isNull(professionals.deletedAt)),
					),
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
						storeId: data.storeId,
						deletedAt: null,
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
					.where(and(eq(professionals.id, id), isNull(professionals.deletedAt)))
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
				db
					.update(professionals)
					.set({
						deletedAt: new Date(),
						updatedAt: new Date(),
					})
					.where(and(eq(professionals.id, id), isNull(professionals.deletedAt)))
					.returning(),
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
