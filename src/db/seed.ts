import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { logger } from "@/common/logger";
import {
	appointmentExdates,
	appointmentOverrides,
	appointments,
	clients,
	type NewAppointment,
	type NewAppointmentExdate,
	type NewAppointmentOverride,
	type NewClient,
	type NewProfessional,
	professionals,
} from "@/db/schema";

const connectionString = Bun.env.DATABASE_URL;

const clientIds = {
	joana: "15f968f6-df8a-42b4-b2f4-82f6e82395f1",
	carlos: "3d8f4aa7-e27e-4eb8-b6e7-4f0f2f89014f",
	marina: "d64af340-9207-4627-8f76-02b55309b475",
} as const;

const professionalIds = {
	ana: "8d3a0391-8a58-4da3-9d82-a96f37676357",
	bruno: "6f2cfc5f-b238-4ad8-a8a8-c1c5acb251d3",
	fernanda: "5db5eb06-a67f-4f11-8014-b5cab6ee2ca8",
} as const;

const clientsSeedData: NewClient[] = [
	{
		id: clientIds.joana,
		name: "Joana Silva",
		taxId: "12345678900",
		cellphone: "+55 (11) 98888-1111",
	},
	{
		id: clientIds.carlos,
		name: "Carlos Souza",
		taxId: "98765432100",
		cellphone: "+55 (11) 97777-2222",
	},
	{
		id: clientIds.marina,
		name: "Marina Lima",
		taxId: "11223344567",
		cellphone: "+55 (11) 96666-3333",
	},
] as const;

const professionalsSeedData: NewProfessional[] = [
	{
		id: professionalIds.ana,
		name: "Dra. Ana Costa",
		taxId: "12345678901",
		cellphone: "+55 (11) 95555-1111",
	},
	{
		id: professionalIds.bruno,
		name: "Dr. Bruno Ribeiro",
		taxId: "10987654321",
		cellphone: "+55 (11) 94444-2222",
	},
	{
		id: professionalIds.fernanda,
		name: "Dra. Fernanda Alves",
		taxId: "11223344556",
		cellphone: "+55 (11) 93333-3333",
	},
] as const;

const appointmentsSeedData: NewAppointment[] = [
	{
		id: "2b412040-79eb-4826-8e5a-eb7d58fef214",
		uid: "2b412040-79eb-4826-8e5a-eb7d58fef214@appointment.local",
		summary: "Sessão inicial",
		description: "Primeira conversa para entender objetivos terapêuticos.",
		dtstart: new Date("2026-03-03T14:00:00.000Z"),
		dtend: new Date("2026-03-03T15:00:00.000Z"),
		timezone: "UTC",
		status: "CONFIRMED",
		sequence: 0,
		dtstamp: new Date(),
		clientId: clientIds.carlos,
		professionalId: professionalIds.ana,
	},
	{
		id: "44a4bd5c-68e4-44d4-b458-a75f12a95239",
		uid: "44a4bd5c-68e4-44d4-b458-a75f12a95239@appointment.local",
		summary: "Acompanhamento mensal",
		description: "Revisão de evolução e ajuste de plano terapêutico.",
		dtstart: new Date("2026-01-10T13:00:00.000Z"),
		dtend: new Date("2026-01-10T14:00:00.000Z"),
		timezone: "UTC",
		status: "CONFIRMED",
		sequence: 2,
		dtstamp: new Date(),
		rrule: "FREQ=WEEKLY;BYDAY=FR",
		clientId: clientIds.marina,
		professionalId: professionalIds.fernanda,
	},
	{
		id: "c7f2665d-a7dd-45f9-9ff3-262d7e6549fd",
		uid: "c7f2665d-a7dd-45f9-9ff3-262d7e6549fd@appointment.local",
		summary: "Sessão de retorno",
		description: "Retorno focado em estratégias para rotina semanal.",
		dtstart: new Date("2026-02-17T16:30:00.000Z"),
		dtend: new Date("2026-02-17T17:30:00.000Z"),
		timezone: "UTC",
		status: "CONFIRMED",
		sequence: 1,
		dtstamp: new Date(),
		clientId: clientIds.carlos,
		professionalId: professionalIds.bruno,
	},
] as const;

const appointmentExdatesSeedData: NewAppointmentExdate[] = [
	{
		appointmentId: "44a4bd5c-68e4-44d4-b458-a75f12a95239",
		exdate: new Date("2026-01-24T13:00:00.000Z"),
	},
	{
		appointmentId: "44a4bd5c-68e4-44d4-b458-a75f12a95239",
		exdate: new Date("2026-02-07T13:00:00.000Z"),
	},
] as const;

const appointmentOverridesSeedData: NewAppointmentOverride[] = [
	{
		appointmentId: "44a4bd5c-68e4-44d4-b458-a75f12a95239",
		recurrenceId: new Date("2026-01-31T13:00:00.000Z"),
		summary: "Acompanhamento mensal (horário ajustado)",
		description: "Sessão realizada com início 30 minutos depois.",
		dtstart: new Date("2026-01-31T13:30:00.000Z"),
		dtend: new Date("2026-01-31T14:30:00.000Z"),
		status: "CONFIRMED",
		professionalId: professionalIds.fernanda,
		sequence: 2,
		dtstamp: new Date(),
	},
	{
		appointmentId: "c7f2665d-a7dd-45f9-9ff3-262d7e6549fd",
		recurrenceId: new Date("2026-02-24T16:30:00.000Z"),
		summary: "Sessão de retorno (realizada)",
		description: "Ocorrência realizada e encerrada sem pendências.",
		dtstart: new Date("2026-02-24T16:30:00.000Z"),
		dtend: new Date("2026-02-24T17:30:00.000Z"),
		status: "CONFIRMED",
		professionalId: professionalIds.bruno,
		sequence: 1,
		dtstamp: new Date(),
	},
] as const;

async function seedDatabase(): Promise<void> {
	if (!connectionString) {
		logger.error("DATABASE_URL is not defined in environment variables.");

		process.exit(1);
	}

	const sql = postgres(connectionString);
	const db = drizzle(sql);

	try {
		await db.transaction(async (tx) => {
			await tx.delete(appointmentOverrides);
			await tx.delete(appointmentExdates);
			await tx.delete(appointments);
			await tx.delete(professionals);
			await tx.delete(clients);

			await tx.insert(clients).values(clientsSeedData);
			await tx.insert(professionals).values(professionalsSeedData);
			await tx.insert(appointments).values(appointmentsSeedData);
			await tx.insert(appointmentExdates).values(appointmentExdatesSeedData);
			await tx
				.insert(appointmentOverrides)
				.values(appointmentOverridesSeedData);
		});

		logger.info("Database seed completed", {
			clients: clientsSeedData.length,
			professionals: professionalsSeedData.length,
			appointments: appointmentsSeedData.length,
			exdates: appointmentExdatesSeedData.length,
			overrides: appointmentOverridesSeedData.length,
		});
	} finally {
		await sql.end();
	}
}

seedDatabase().catch((error: unknown) => {
	logger.error("Failed to seed database", {
		error,
	});

	process.exit(1);
});
