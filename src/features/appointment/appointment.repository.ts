import { and, eq, gt, gte, isNull, lt, lte, ne } from "drizzle-orm";
import { err, ok } from "neverthrow";

import { NotFoundError } from "@/common/errors";
import { getTableCount, wrapDatabaseOperation } from "@/common/utils/database";
import { db } from "@/db";
import {
	appointmentEvents,
	appointments,
	clients,
	professionals,
} from "@/db/schema";

import type { IAppointmentRepository } from "./appointment.repository.interface";
import type {
	AppointmentProjection,
	CreateAppointmentEventInput,
	CreateAppointmentInput,
	UpdateAppointmentInput,
} from "./appointment.types";

export class AppointmentRepository implements IAppointmentRepository {
	private addRecurrenceDate(
		date: Date,
		recurrence: "weekly" | "monthly",
	): Date {
		const nextDate = new Date(date);

		if (recurrence === "weekly") {
			nextDate.setDate(nextDate.getDate() + 7);
			return nextDate;
		}

		nextDate.setMonth(nextDate.getMonth() + 1);

		return nextDate;
	}

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
				from ? gte(appointments.startDate, from) : undefined,
				to ? lte(appointments.startDate, to) : undefined,
			].filter(Boolean) as Parameters<typeof and>;

			const baseQuery = db
				.select({
					id: appointments.id,
					title: appointments.title,
					startDate: appointments.startDate,
					endDate: appointments.endDate,
					clientId: appointments.clientId,
					professionalId: appointments.professionalId,
					active: appointments.active,
					recurrence: appointments.recurrence,
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

	async findNonRecurringByDateRange(from?: Date, to?: Date) {
		return wrapDatabaseOperation(async () => {
			const conditions = [
				isNull(appointments.deletedAt),
				eq(appointments.recurrence, "none"),
				from ? gte(appointments.startDate, from) : undefined,
				to ? lte(appointments.startDate, to) : undefined,
			].filter(Boolean) as Parameters<typeof and>;

			const nonRecurringAppointments = await db
				.select({
					id: appointments.id,
					title: appointments.title,
					startDate: appointments.startDate,
					endDate: appointments.endDate,
					observation: appointments.observation,
					recurrence: appointments.recurrence,
					clientName: clients.name,
					professionalName: professionals.name,
				})
				.from(appointments)
				.innerJoin(clients, eq(appointments.clientId, clients.id))
				.innerJoin(
					professionals,
					eq(appointments.professionalId, professionals.id),
				)
				.where(and(...conditions));

			return nonRecurringAppointments.map((appointment) => ({
				sourceAppointmentId: appointment.id,
				title: appointment.title,
				startDate: appointment.startDate,
				endDate: appointment.endDate,
				observation: appointment.observation,
				recurrence: appointment.recurrence,
				clientName: appointment.clientName,
				professionalName: appointment.professionalName,
			}));
		}, "Failed to fetch non-recurring appointments");
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

	async create(data: CreateAppointmentInput) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.insert(appointments)
					.values({
						title: data.title,
						startDate: new Date(data.startDate),
						endDate: new Date(data.endDate),
						recurrence: data.recurrence ?? "none",
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
						...(data.title !== undefined && { title: data.title }),
						// biome-ignore format: to avoid breaking the conditional properties
						...(data.startDate !== undefined && { startDate: new Date(data.startDate), }),
						// biome-ignore format: to avoid breaking the conditional properties
						...(data.endDate !== undefined && { endDate: new Date(data.endDate), }),
						// biome-ignore format: to avoid breaking the conditional properties
						...(data.recurrence !== undefined && { recurrence: data.recurrence }),
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

	async findProjectedByDateRange(from?: Date, to?: Date) {
		return wrapDatabaseOperation(async () => {
			const rangeStart = from ?? new Date();

			// Default to 3 months range if 'to' is not provided
			const threeMonthsInMs = 1000 * 60 * 60 * 24 * 90;

			const rangeEnd = to ?? new Date(rangeStart.getTime() + threeMonthsInMs);

			const recurringAppointments = await db
				.select({
					id: appointments.id,
					title: appointments.title,
					startDate: appointments.startDate,
					endDate: appointments.endDate,
					active: appointments.active,
					recurrence: appointments.recurrence,
					observation: appointments.observation,
					clientName: clients.name,
					professionalName: professionals.name,
				})
				.from(appointments)
				.innerJoin(clients, eq(appointments.clientId, clients.id))
				.innerJoin(
					professionals,
					eq(appointments.professionalId, professionals.id),
				)
				.where(
					and(
						ne(appointments.recurrence, "none"),
						eq(appointments.active, true),
						isNull(appointments.deletedAt),
					),
				);

			const projected: AppointmentProjection[] = [];

			for (const appointment of recurringAppointments) {
				if (appointment.recurrence === "none" || !appointment.active) {
					continue;
				}

				let currentStart = new Date(appointment.startDate);
				let currentEnd = new Date(appointment.endDate);
				let guard = 0;

				while (currentStart <= rangeEnd && guard < 600) {
					if (currentStart >= rangeStart) {
						projected.push({
							sourceAppointmentId: appointment.id,
							title: appointment.title,
							startDate: new Date(currentStart),
							endDate: new Date(currentEnd),
							observation: appointment.observation,
							recurrence: appointment.recurrence,
							clientName: appointment.clientName,
							professionalName: appointment.professionalName,
						});
					}

					currentStart = this.addRecurrenceDate(
						currentStart,
						appointment.recurrence,
					);

					currentEnd = this.addRecurrenceDate(
						currentEnd,
						appointment.recurrence,
					);

					guard += 1;
				}
			}

			projected.sort((left, right) => {
				return left.startDate.getTime() - right.startDate.getTime();
			});

			return projected;
		}, "Failed to project recurring appointments");
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

	async hasConflictInProjection(
		professionalId: string,
		startDate: Date,
		endDate: Date,
		excludedAppointmentId?: string,
	) {
		return wrapDatabaseOperation(async () => {
			const recurringConditions = [
				eq(appointments.professionalId, professionalId),
				ne(appointments.recurrence, "none"),
				eq(appointments.active, true),
				isNull(appointments.deletedAt),
				excludedAppointmentId
					? ne(appointments.id, excludedAppointmentId)
					: undefined,
			].filter(Boolean) as Parameters<typeof and>;

			const recurringAppointments = await db
				.select({
					id: appointments.id,
					startDate: appointments.startDate,
					endDate: appointments.endDate,
					recurrence: appointments.recurrence,
				})
				.from(appointments)
				.where(and(...recurringConditions));

			for (const appointment of recurringAppointments) {
				if (appointment.recurrence === "none") {
					continue;
				}

				let currentStart = new Date(appointment.startDate);
				let currentEnd = new Date(appointment.endDate);
				let guard = 0;

				while (currentStart < endDate && guard < 600) {
					if (currentStart < endDate && currentEnd > startDate) {
						return true;
					}

					currentStart = this.addRecurrenceDate(
						currentStart,
						appointment.recurrence,
					);

					currentEnd = this.addRecurrenceDate(
						currentEnd,
						appointment.recurrence,
					);

					guard += 1;
				}
			}

			return false;
		}, "Failed to verify projected appointment conflicts");
	}

	async createEvent(appointmentId: string, data: CreateAppointmentEventInput) {
		const appointmentResult = await this.findById(appointmentId);

		if (appointmentResult.isErr()) {
			return err(appointmentResult.error);
		}

		const appointment = appointmentResult.value;

		const result = await wrapDatabaseOperation(
			() =>
				db
					.insert(appointmentEvents)
					.values({
						appointmentId,
						status: data.status,
						summary: data.summary ?? null,
						originalStartDate: appointment.startDate,
						originalEndDate: appointment.endDate,
						actualStartDate: data.actualStartDate
							? new Date(data.actualStartDate)
							: null,
						actualEndDate: data.actualEndDate
							? new Date(data.actualEndDate)
							: null,
						performedByClientId: data.performedByClientId ?? null,
						newAppointmentId: data.newAppointmentId ?? null,
					})
					.returning(),
			"Failed to create appointment event",
		);

		return result.map(([event]) => event);
	}

	async findEventsByAppointmentId(appointmentId: string) {
		return wrapDatabaseOperation(
			() =>
				db
					.select()
					.from(appointmentEvents)
					.where(eq(appointmentEvents.appointmentId, appointmentId)),
			"Failed to fetch appointment events",
		);
	}
}
