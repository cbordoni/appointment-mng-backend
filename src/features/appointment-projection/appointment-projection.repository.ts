import {
	and,
	eq,
	gt,
	inArray,
	isNotNull,
	isNull,
	lt,
	lte,
	ne,
	or,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { err, ok } from "neverthrow";

import { wrapDatabaseOperation } from "@/common/utils/database";
import { db } from "@/db";
import {
	accounts,
	appointmentExdates,
	appointmentOverrides,
	appointments,
	clients,
	professionals,
} from "@/db/schema";

import type { IAppointmentProjectionRepository } from "./appointment-projection.repository.interface";

export class AppointmentProjectionRepository
	implements IAppointmentProjectionRepository
{
	async findProjectionContext(from: Date, to: Date) {
		const clientAccounts = alias(accounts, "client_accounts");
		const professionalAccounts = alias(accounts, "professional_accounts");

		const appointmentsResult = await wrapDatabaseOperation(
			() =>
				db
					.select({
						id: appointments.id,
						uid: appointments.uid,
						summary: appointments.summary,
						description: appointments.description,
						dtStart: appointments.dtStart,
						dtEnd: appointments.dtEnd,
						timezone: appointments.timezone,
						rrule: appointments.rrule,
						status: appointments.status,
						sequence: appointments.sequence,
						dtstamp: appointments.dtstamp,
						deletedAt: appointments.deletedAt,
						clientId: appointments.clientId,
						professionalId: appointments.professionalId,
						createdAt: appointments.createdAt,
						updatedAt: appointments.updatedAt,
						clientName: clientAccounts.name,
						professionalName: professionalAccounts.name,
					})
					.from(appointments)
					.innerJoin(clients, eq(appointments.clientId, clients.id))
					.innerJoin(clientAccounts, eq(clients.accountId, clientAccounts.id))
					.innerJoin(
						professionals,
						eq(appointments.professionalId, professionals.id),
					)
					.innerJoin(
						professionalAccounts,
						eq(professionals.accountId, professionalAccounts.id),
					)
					.where(
						and(
							isNull(appointments.deletedAt),
							isNull(clients.deletedAt),
							isNull(professionals.deletedAt),
							isNull(clientAccounts.deletedAt),
							isNull(professionalAccounts.deletedAt),
							ne(appointments.status, "CANCELLED"),
							lte(appointments.dtStart, to),
							or(
								isNotNull(appointments.rrule),
								and(lt(appointments.dtStart, to), gt(appointments.dtEnd, from)),
							),
						),
					),
			"Failed to fetch appointment projection context",
		);

		if (appointmentsResult.isErr()) {
			return err(appointmentsResult.error);
		}

		const appointmentRows = appointmentsResult.value;
		const appointmentIds = appointmentRows.map((row) => row.id);

		if (appointmentIds.length === 0) {
			return ok([]);
		}

		const [exdatesResult, overridesResult] = await Promise.all([
			wrapDatabaseOperation(
				() =>
					db
						.select()
						.from(appointmentExdates)
						.where(inArray(appointmentExdates.appointmentId, appointmentIds)),
				"Failed to fetch appointment projection exdates",
			),
			wrapDatabaseOperation(
				() =>
					db
						.select()
						.from(appointmentOverrides)
						.where(inArray(appointmentOverrides.appointmentId, appointmentIds)),
				"Failed to fetch appointment projection overrides",
			),
		]);

		if (exdatesResult.isErr()) {
			return err(exdatesResult.error);
		}

		if (overridesResult.isErr()) {
			return err(overridesResult.error);
		}

		const exdatesByAppointmentId = new Map<string, Date[]>();
		const overridesByAppointmentId = new Map<
			string,
			typeof overridesResult.value
		>();

		for (const item of exdatesResult.value) {
			const current = exdatesByAppointmentId.get(item.appointmentId) ?? [];

			current.push(item.exdate);

			exdatesByAppointmentId.set(item.appointmentId, current);
		}

		for (const item of overridesResult.value) {
			const current = overridesByAppointmentId.get(item.appointmentId) ?? [];

			current.push(item);

			overridesByAppointmentId.set(item.appointmentId, current);
		}

		return ok(
			appointmentRows.map((appointment) => ({
				appointment,
				exdates: exdatesByAppointmentId.get(appointment.id) ?? [],
				overrides: (overridesByAppointmentId.get(appointment.id) ?? []).map(
					(override) => ({
						recurrenceId: override.recurrenceId,
						summary: override.summary,
						description: override.description,
						dtStart: override.dtstart,
						dtEnd: override.dtend,
						status: override.status,
						professionalId: override.professionalId,
					}),
				),
			})),
		);
	}
}
