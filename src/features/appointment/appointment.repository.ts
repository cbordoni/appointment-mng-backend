import { and, eq, gt, gte, isNull, lt, lte, ne, sql } from "drizzle-orm";
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
				from ? gte(appointments.dtstart, from) : undefined,
				to ? lte(appointments.dtstart, to) : undefined,
			].filter(Boolean) as Parameters<typeof and>;

			const baseQuery = db
				.select({
					id: appointments.id,
					uid: appointments.uid,
					summary: appointments.summary,
					description: appointments.description,
					dtstart: appointments.dtstart,
					dtend: appointments.dtend,
					timezone: appointments.timezone,
					clientId: appointments.clientId,
					professionalId: appointments.professionalId,
					rrule: appointments.rrule,
					status: appointments.status,
					sequence: appointments.sequence,
					dtstamp: appointments.dtstamp,
					deletedAt: appointments.deletedAt,
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
			async () =>
				db
					.select()
					.from(appointments)
					.where(and(eq(appointments.id, id), isNull(appointments.deletedAt))),
			"Failed to fetch appointment",
		);

		if (result.isErr()) {
			return err(result.error);
		}

		const [appointment] = result.value;

		if (!appointment) {
			return err(new NotFoundError("Appointment", id));
		}

		return ok(appointment);
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
		const createResult = await wrapDatabaseOperation(async () => {
			const appointmentId = crypto.randomUUID();
			const uid = data.uid ?? `${appointmentId}@appointment.local`;

			const [appointment] = await db
				.insert(appointments)
				.values({
					id: appointmentId,
					uid,
					summary: data.summary,
					description: data.description ?? null,
					dtstart: new Date(data.dtstart),
					dtend: new Date(data.dtend),
					timezone: data.timezone ?? "UTC",
					rrule: data.rrule ?? null,
					status: data.status ?? "CONFIRMED",
					sequence: data.sequence ?? 0,
					dtstamp: new Date(),
					deletedAt: null,
					clientId: data.clientId,
					professionalId: data.professionalId,
				})
				.returning();

			return appointment;
		}, "Failed to create appointment");

		if (createResult.isErr()) {
			return err(createResult.error);
		}

		return ok(createResult.value);
	}

	async update(id: string, data: UpdateAppointmentInput) {
		const updateResult = await wrapDatabaseOperation(async () => {
			const [appointment] = await db
				.update(appointments)
				.set({
					...(data.uid !== undefined && { uid: data.uid }),
					...(data.summary !== undefined && { summary: data.summary }),
					...(data.description !== undefined && {
						description: data.description,
					}),
					...(data.dtstart !== undefined && {
						dtstart: new Date(data.dtstart),
					}),
					...(data.dtend !== undefined && { dtend: new Date(data.dtend) }),
					...(data.timezone !== undefined && { timezone: data.timezone }),
					...("rrule" in data && { rrule: data.rrule ?? null }),
					...(data.status !== undefined && { status: data.status }),
					...(data.sequence !== undefined && { sequence: data.sequence }),
					...(data.sequence === undefined && {
						sequence: sql`${appointments.sequence} + 1`,
					}),
					...(data.professionalId !== undefined && {
						professionalId: data.professionalId,
					}),
					dtstamp: new Date(),
					updatedAt: new Date(),
				})
				.where(and(eq(appointments.id, id), isNull(appointments.deletedAt)))
				.returning();

			return appointment;
		}, "Failed to update appointment");

		if (updateResult.isErr()) {
			return err(updateResult.error);
		}

		const appointment = updateResult.value;

		if (!appointment) {
			return err(new NotFoundError("Appointment", id));
		}

		return ok(appointment);
	}

	async delete(id: string) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.update(appointments)
					.set({
						status: "CANCELLED",
						sequence: sql`${appointments.sequence} + 1`,
						dtstamp: new Date(),
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
		dtstart: Date,
		dtend: Date,
		excludedAppointmentId?: string,
	) {
		return wrapDatabaseOperation(async () => {
			const exclusionCondition = excludedAppointmentId
				? ne(appointments.id, excludedAppointmentId)
				: undefined;

			const conditions = [
				eq(appointments.professionalId, professionalId),
				ne(appointments.status, "CANCELLED"),
				isNull(appointments.deletedAt),
				lt(appointments.dtstart, dtend),
				gt(appointments.dtend, dtstart),
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
