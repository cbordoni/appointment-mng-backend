import { and, eq, gte, lte } from "drizzle-orm";
import { err, ok } from "neverthrow";

import { NotFoundError } from "@/common/errors";
import { getTableCount, wrapDatabaseOperation } from "@/common/utils/database";
import { db } from "@/db";
import { appointments, users } from "@/db/schema";

import type { IAppointmentRepository } from "./appointment.repository.interface";
import type {
	CreateAppointmentInput,
	UpdateAppointmentInput,
} from "./appointment.types";

export class AppointmentRepository implements IAppointmentRepository {
	async findAll(page: number, limit: number) {
		return wrapDatabaseOperation(async () => {
			const offset = (page - 1) * limit;

			const [items, total] = await Promise.all([
				db.select().from(appointments).limit(limit).offset(offset),
				getTableCount(appointments),
			]);

			return { items, total };
		}, "Failed to fetch appointments");
	}

	async findByDateRange(from?: Date, to?: Date) {
		return wrapDatabaseOperation(() => {
			const conditions = [
				from ? gte(appointments.startDate, from) : undefined,
				to ? lte(appointments.startDate, to) : undefined,
			].filter(Boolean) as Parameters<typeof and>;

			const baseQuery = db
				.select({
					id: appointments.id,
					title: appointments.title,
					startDate: appointments.startDate,
					endDate: appointments.endDate,
					observation: appointments.observation,
					userName: users.name,
					createdAt: appointments.createdAt,
					updatedAt: appointments.updatedAt,
				})
				.from(appointments)
				.innerJoin(users, eq(appointments.userId, users.id));

			return conditions.length
				? baseQuery.where(and(...conditions))
				: baseQuery;
		}, "Failed to fetch appointments");
	}

	async findById(id: string) {
		const result = await wrapDatabaseOperation(
			() => db.select().from(appointments).where(eq(appointments.id, id)),
			"Failed to fetch appointment",
		);

		return result.andThen(([appointment]) => {
			if (!appointment) {
				return err(new NotFoundError("Appointment", id));
			}

			return ok(appointment);
		});
	}

	async findByUserId(userId: string, page: number, limit: number) {
		return wrapDatabaseOperation(async () => {
			const offset = (page - 1) * limit;

			const [items, total] = await Promise.all([
				db
					.select()
					.from(appointments)
					.where(eq(appointments.userId, userId))
					.limit(limit)
					.offset(offset),
				getTableCount(appointments, eq(appointments.userId, userId)),
			]);

			return { items, total };
		}, "Failed to fetch appointments by user");
	}

	async create(data: CreateAppointmentInput) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.insert(appointments)
					.values({
						title: data.title,
						startDate: new Date(data.startDate),
						endDate: new Date(data.endDate),
						observation: data.observation ?? null,
						userId: data.userId,
					})
					.returning(),
			"Failed to create appointment",
		);

		return result.map(([appointment]) => appointment);
	}

	async update(id: string, data: UpdateAppointmentInput) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.update(appointments)
					.set({
						// biome-ignore format: to avoid breaking the conditional properties
						...(data.title !== undefined && { title: data.title }),
						// biome-ignore format: to avoid breaking the conditional properties
						...(data.startDate !== undefined && { startDate: new Date(data.startDate), }),
						// biome-ignore format: to avoid breaking the conditional properties
						...(data.endDate !== undefined && { endDate: new Date(data.endDate), }),
						// biome-ignore format: to avoid breaking the conditional properties
						...(data.observation !== undefined && { observation: data.observation }),
						updatedAt: new Date(),
					})
					.where(eq(appointments.id, id))
					.returning(),
			"Failed to update appointment",
		);

		return result.andThen(([appointment]) => {
			if (!appointment) {
				return err(new NotFoundError("Appointment", id));
			}

			return ok(appointment);
		});
	}

	async delete(id: string) {
		const result = await wrapDatabaseOperation(
			() => db.delete(appointments).where(eq(appointments.id, id)).returning(),
			"Failed to delete appointment",
		);

		return result.andThen(([appointment]) => {
			if (!appointment) {
				return err(new NotFoundError("Appointment", id));
			}

			return ok(undefined);
		});
	}
}
