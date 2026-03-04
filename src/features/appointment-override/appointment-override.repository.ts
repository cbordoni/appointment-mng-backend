import { eq, inArray } from "drizzle-orm";
import { err, ok } from "neverthrow";

import { NotFoundError } from "@/common/errors";
import { getTableCount, wrapDatabaseOperation } from "@/common/utils/database";
import { db } from "@/db";
import { type AppointmentOverride, appointmentOverrides } from "@/db/schema";

import type { IAppointmentOverrideRepository } from "./appointment-override.repository.interface";
import type {
	AppointmentOverrideReplaceInput,
	CreateAppointmentOverrideInput,
	UpdateAppointmentOverrideInput,
} from "./appointment-override.types";

export class AppointmentOverrideRepository
	implements IAppointmentOverrideRepository
{
	async findAll(page: number, limit: number) {
		return wrapDatabaseOperation(async () => {
			const offset = (page - 1) * limit;

			const [items, total] = await Promise.all([
				db.select().from(appointmentOverrides).limit(limit).offset(offset),
				getTableCount(appointmentOverrides),
			]);

			return { items, total };
		}, "Failed to fetch appointment overrides");
	}

	async findById(id: string) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.select()
					.from(appointmentOverrides)
					.where(eq(appointmentOverrides.id, id)),
			"Failed to fetch appointment override",
		);

		return result.andThen(([override]) => {
			if (!override) {
				return err(new NotFoundError("AppointmentOverride", id));
			}

			return ok(override);
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
					.from(appointmentOverrides)
					.where(inArray(appointmentOverrides.appointmentId, appointmentIds)),
			"Failed to fetch appointment overrides by appointment ids",
		);

		return result.map((rows) => rows as AppointmentOverride[]);
	}

	async create(data: CreateAppointmentOverrideInput) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.insert(appointmentOverrides)
					.values({
						appointmentId: data.appointmentId,
						recurrenceId: new Date(data.recurrenceId),
						summary: data.summary ?? null,
						description: data.description ?? null,
						dtstart: data.dtstart ? new Date(data.dtstart) : null,
						dtend: data.dtend ? new Date(data.dtend) : null,
						status: data.status ?? null,
						professionalId: data.professionalId ?? null,
						sequence: data.sequence ?? 0,
						dtstamp: data.dtstamp ? new Date(data.dtstamp) : new Date(),
					})
					.returning(),
			"Failed to create appointment override",
		);

		return result.map(([override]) => override);
	}

	async update(id: string, data: UpdateAppointmentOverrideInput) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.update(appointmentOverrides)
					.set({
						...(data.appointmentId !== undefined && {
							appointmentId: data.appointmentId,
						}),
						...(data.recurrenceId !== undefined && {
							recurrenceId: new Date(data.recurrenceId),
						}),
						...(data.summary !== undefined && { summary: data.summary }),
						...(data.description !== undefined && {
							description: data.description,
						}),
						...(data.dtstart !== undefined && {
							dtstart: data.dtstart ? new Date(data.dtstart) : null,
						}),
						...(data.dtend !== undefined && {
							dtend: data.dtend ? new Date(data.dtend) : null,
						}),
						...(data.status !== undefined && { status: data.status }),
						...(data.professionalId !== undefined && {
							professionalId: data.professionalId,
						}),
						...(data.sequence !== undefined && { sequence: data.sequence }),
						...(data.dtstamp !== undefined && {
							dtstamp: new Date(data.dtstamp),
						}),
						updatedAt: new Date(),
					})
					.where(eq(appointmentOverrides.id, id))
					.returning(),
			"Failed to update appointment override",
		);

		return result.andThen(([override]) => {
			if (!override) {
				return err(new NotFoundError("AppointmentOverride", id));
			}

			return ok(override);
		});
	}

	async replaceByAppointmentId(
		appointmentId: string,
		overrides: AppointmentOverrideReplaceInput[],
	) {
		const result = await wrapDatabaseOperation(async () => {
			await db
				.delete(appointmentOverrides)
				.where(eq(appointmentOverrides.appointmentId, appointmentId));

			if (overrides.length > 0) {
				await db.insert(appointmentOverrides).values(
					overrides.map((override) => ({
						appointmentId,
						recurrenceId: override.recurrenceId,
						summary: override.summary,
						description: override.description,
						dtstart: override.dtstart,
						dtend: override.dtend,
						status: override.status,
						professionalId: override.professionalId,
						sequence: override.sequence,
						dtstamp: override.dtstamp,
					})),
				);
			}

			return undefined;
		}, "Failed to replace appointment overrides");

		return result.map(() => undefined);
	}

	async delete(id: string) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.delete(appointmentOverrides)
					.where(eq(appointmentOverrides.id, id))
					.returning(),
			"Failed to delete appointment override",
		);

		return result.andThen(([override]) => {
			if (!override) {
				return err(new NotFoundError("AppointmentOverride", id));
			}

			return ok(undefined);
		});
	}
}
