import { eq, inArray } from "drizzle-orm";
import { err, ok } from "neverthrow";

import { NotFoundError } from "@/common/errors";
import { getTableCount, wrapDatabaseOperation } from "@/common/utils/database";
import { db } from "@/db";
import { appointmentExdates } from "@/db/schema";

import type { IAppointmentExceptionRepository } from "./appointment-exception.repository.interface";
import type {
	CreateAppointmentExceptionInput,
	UpdateAppointmentExceptionInput,
} from "./appointment-exception.types";

export class AppointmentExceptionRepository
	implements IAppointmentExceptionRepository
{
	async findAll(page: number, limit: number) {
		return wrapDatabaseOperation(async () => {
			const offset = (page - 1) * limit;

			const [items, total] = await Promise.all([
				db.select().from(appointmentExdates).limit(limit).offset(offset),
				getTableCount(appointmentExdates),
			]);

			return { items, total };
		}, "Failed to fetch appointment exceptions");
	}

	async findById(id: string) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.select()
					.from(appointmentExdates)
					.where(eq(appointmentExdates.id, id)),
			"Failed to fetch appointment exception",
		);

		return result.andThen(([exception]) => {
			if (!exception) {
				return err(new NotFoundError("AppointmentException", id));
			}

			return ok(exception);
		});
	}

	async findByAppointmentIds(appointmentIds: string[]) {
		if (appointmentIds.length === 0) {
			return ok([]);
		}

		const result = await wrapDatabaseOperation(
			() =>
				db
					.select()
					.from(appointmentExdates)
					.where(inArray(appointmentExdates.appointmentId, appointmentIds)),
			"Failed to fetch appointment exceptions by appointment ids",
		);

		return result.map((rows) => rows);
	}

	async create(data: CreateAppointmentExceptionInput) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.insert(appointmentExdates)
					.values({
						appointmentId: data.appointmentId,
						exdate: new Date(data.exdate),
					})
					.returning(),
			"Failed to create appointment exception",
		);

		return result.map(([exception]) => exception);
	}

	async update(id: string, data: UpdateAppointmentExceptionInput) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.update(appointmentExdates)
					.set({
						...(data.appointmentId !== undefined && {
							appointmentId: data.appointmentId,
						}),
						...(data.exdate !== undefined && { exdate: new Date(data.exdate) }),
						updatedAt: new Date(),
					})
					.where(eq(appointmentExdates.id, id))
					.returning(),
			"Failed to update appointment exception",
		);

		return result.andThen(([exception]) => {
			if (!exception) {
				return err(new NotFoundError("AppointmentException", id));
			}

			return ok(exception);
		});
	}

	async replaceByAppointmentId(appointmentId: string, exdates: Date[]) {
		const result = await wrapDatabaseOperation(async () => {
			await db
				.delete(appointmentExdates)
				.where(eq(appointmentExdates.appointmentId, appointmentId));

			if (exdates.length > 0) {
				await db.insert(appointmentExdates).values(
					exdates.map((exdate) => ({
						appointmentId,
						exdate,
					})),
				);
			}

			return undefined;
		}, "Failed to replace appointment exceptions");

		return result.map(() => undefined);
	}

	async delete(id: string) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.delete(appointmentExdates)
					.where(eq(appointmentExdates.id, id))
					.returning(),
			"Failed to delete appointment exception",
		);

		return result.andThen(([exception]) => {
			if (!exception) {
				return err(new NotFoundError("AppointmentException", id));
			}

			return ok(undefined);
		});
	}
}
