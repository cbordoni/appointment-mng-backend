import { and, eq, gt, gte, isNull, lt, lte, ne } from "drizzle-orm";
import { err, ok } from "neverthrow";

import { NotFoundError } from "@/common/errors";
import { getTableCount, wrapDatabaseOperation } from "@/common/utils/database";
import { db } from "@/db";
import { appointments, clients, professionals } from "@/db/schema";

import type { IAppointmentRepository } from "./appointment.repository.interface";
import type {
	CreateAppointmentInput,
	UpdateAppointmentInput,
} from "./appointment.types";

export class AppointmentRepository implements IAppointmentRepository {
	async findAll(page: number, limit: number) {
		return wrapDatabaseOperation(async () => {
			const offset = (page - 1) * limit;
			const notDeleted = isNull(appointments.deletedAt);

			const [items, total] = await Promise.all([
				db
					.select()
					.from(appointments)
					.where(notDeleted)
					.limit(limit)
					.offset(offset),
				getTableCount(appointments, notDeleted),
			]);

			return { items, total };
		}, "Failed to fetch appointments");
	}

	async findByDateRange(from?: Date, to?: Date) {
		return wrapDatabaseOperation(() => {
			const conditions = [
				isNull(appointments.deletedAt),
				isNull(clients.deletedAt),
				isNull(professionals.deletedAt),
				from ? gte(appointments.startDate, from) : undefined,
				to ? lte(appointments.startDate, to) : undefined,
			].filter(Boolean) as Parameters<typeof and>;

			const baseQuery = db
				.select({
					id: appointments.id,
					summary: appointments.summary,
					startDate: appointments.startDate,
					endDate: appointments.endDate,
					clientId: appointments.clientId,
					professionalId: appointments.professionalId,
					active: appointments.active,
					rrule: appointments.rrule,
					deletedAt: appointments.deletedAt,
					observation: appointments.observation,
					clientName: clients.name,
					professionalName: professionals.name,
					createdAt: appointments.createdAt,
					updatedAt: appointments.updatedAt,
				})
				.from(appointments)
				.innerJoin(clients, eq(appointments.clientId, clients.id))
				.innerJoin(
					professionals,
					eq(appointments.professionalId, professionals.id),
				);

			return conditions.length
				? baseQuery.where(and(...conditions))
				: baseQuery;
		}, "Failed to fetch appointments");
	}

	async findById(id: string) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.select()
					.from(appointments)
					.where(and(eq(appointments.id, id), isNull(appointments.deletedAt))),
			"Failed to fetch appointment",
		);

		return result.andThen(([appointment]) => {
			if (!appointment) {
				return err(new NotFoundError("Appointment", id));
			}

			return ok(appointment);
		});
	}

	async findByClientId(clientId: string, page: number, limit: number) {
		return wrapDatabaseOperation(async () => {
			const offset = (page - 1) * limit;
			const conditions = and(
				eq(appointments.clientId, clientId),
				isNull(appointments.deletedAt),
			);

			const [items, total] = await Promise.all([
				db
					.select()
					.from(appointments)
					.where(conditions)
					.limit(limit)
					.offset(offset),
				getTableCount(appointments, conditions),
			]);

			return { items, total };
		}, "Failed to fetch appointments by client");
	}

	async findByProfessionalId(
		professionalId: string,
		page: number,
		limit: number,
	) {
		return wrapDatabaseOperation(async () => {
			const offset = (page - 1) * limit;

			const conditions = and(
				eq(appointments.professionalId, professionalId),
				isNull(appointments.deletedAt),
			);

			const [items, total] = await Promise.all([
				db
					.select()
					.from(appointments)
					.where(conditions)
					.limit(limit)
					.offset(offset),
				getTableCount(appointments, conditions),
			]);

			return { items, total };
		}, "Failed to fetch appointments by professional");
	}

	async create(data: CreateAppointmentInput) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.insert(appointments)
					.values({
						summary: data.summary,
						startDate: new Date(data.startDate),
						endDate: new Date(data.endDate),
						rrule: data.rrule ?? null,
						active: data.active ?? true,
						deletedAt: null,
						observation: data.observation ?? null,
						clientId: data.clientId,
						professionalId: data.professionalId,
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
						...(data.summary !== undefined && { summary: data.summary }),
						// biome-ignore format: to avoid breaking the conditional properties
						...(data.startDate !== undefined && { startDate: new Date(data.startDate), }),
						// biome-ignore format: to avoid breaking the conditional properties
						...(data.endDate !== undefined && { endDate: new Date(data.endDate), }),
						// biome-ignore format: to avoid breaking the conditional properties
						...("rrule" in data && { rrule: data.rrule ?? null }),
						// biome-ignore format: to avoid breaking the conditional properties
						...(data.active !== undefined && { active: data.active }),
						// biome-ignore format: to avoid breaking the conditional properties
						...(data.observation !== undefined && { observation: data.observation }),
						// biome-ignore format: to avoid breaking the conditional properties
						...(data.professionalId !== undefined && { professionalId: data.professionalId }),
						updatedAt: new Date(),
					})
					.where(and(eq(appointments.id, id), isNull(appointments.deletedAt)))
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
			() =>
				db
					.update(appointments)
					.set({
						active: false,
						deletedAt: new Date(),
						updatedAt: new Date(),
					})
					.where(and(eq(appointments.id, id), isNull(appointments.deletedAt)))
					.returning(),
			"Failed to delete appointment",
		);

		return result.andThen(([appointment]) => {
			if (!appointment) {
				return err(new NotFoundError("Appointment", id));
			}

			return ok(undefined);
		});
	}

	async hasConflictInAppointments(
		professionalId: string,
		startDate: Date,
		endDate: Date,
		excludedAppointmentId?: string,
	) {
		return wrapDatabaseOperation(async () => {
			const exclusionCondition = excludedAppointmentId
				? ne(appointments.id, excludedAppointmentId)
				: undefined;

			const conditions = [
				eq(appointments.professionalId, professionalId),
				eq(appointments.active, true),
				isNull(appointments.deletedAt),
				lt(appointments.startDate, endDate),
				gt(appointments.endDate, startDate),
				exclusionCondition,
			].filter(Boolean) as Parameters<typeof and>;

			const [conflict] = await db
				.select({ id: appointments.id })
				.from(appointments)
				.where(and(...conditions))
				.limit(1);

			return Boolean(conflict);
		}, "Failed to verify appointment conflicts");
	}
}
