import { sql as drizzleSql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { logger } from "@/common/logger";
import {
	accounts,
	appointmentExdates,
	appointmentOverrides,
	appointments,
	clients,
	type NewAccount,
	type NewAppointment,
	type NewAppointmentExdate,
	type NewAppointmentOverride,
	type NewClient,
	type NewProfessional,
	type NewStore,
	professionals,
	stores,
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

const storeIds = {
	matriz: "2cae7e15-e4b8-4c0e-8dce-c20f15327f22",
	moema: "0088dca4-c157-4588-bd14-34e5dd6bd58e",
} as const;

const accountIds = {
	joanaAccount: "41f79e3b-8d1a-4e67-b3c5-9a1f2e8d7c5a",
	carlosAccount: "52e8a04c-9e2b-5f78-c4d6-0b2c3f9e8d6b",
	marinaAccount: "63f9b15d-0f3c-6e89-d5e7-1c3e4f0f9e7c",
} as const;

const storesSeedData: NewStore[] = [
	{
		id: storeIds.matriz,
		name: "Clínica Matriz",
		taxId: "11111111000191",
		email: "matriz@clinica.local",
		cellphone: "+55 (11) 91111-1111",
	},
	{
		id: storeIds.moema,
		name: "Clínica Moema",
		taxId: "22222222000191",
		email: "moema@clinica.local",
		cellphone: "+55 (11) 92222-2222",
	},
] as const;

const clientsSeedData: NewClient[] = [
	{
		id: clientIds.joana,
		accountId: accountIds.joanaAccount,
	},
	{
		id: clientIds.carlos,
		accountId: accountIds.carlosAccount,
	},
	{
		id: clientIds.marina,
		accountId: accountIds.marinaAccount,
	},
] as const;

const professionalsSeedData: NewProfessional[] = [
	{
		id: professionalIds.ana,
		name: "Dra. Ana Costa",
		taxId: "12345678901",
		cellphone: "+55 (11) 95555-1111",
		storeId: storeIds.matriz,
	},
	{
		id: professionalIds.bruno,
		name: "Dr. Bruno Ribeiro",
		taxId: "10987654321",
		cellphone: "+55 (11) 94444-2222",
		storeId: storeIds.moema,
	},
	{
		id: professionalIds.fernanda,
		name: "Dra. Fernanda Alves",
		taxId: "11223344556",
		cellphone: "+55 (11) 93333-3333",
		storeId: storeIds.matriz,
	},
] as const;

const appointmentsSeedData: NewAppointment[] = [
	{
		id: "2b412040-79eb-4826-8e5a-eb7d58fef214",
		uid: "2b412040-79eb-4826-8e5a-eb7d58fef214@appointment.local",
		summary: "Sessão inicial",
		description: "Primeira conversa para entender objetivos terapêuticos.",
		dtStart: new Date("2026-03-03T14:00:00.000Z"),
		dtEnd: new Date("2026-03-03T15:00:00.000Z"),
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
		dtStart: new Date("2026-01-10T13:00:00.000Z"),
		dtEnd: new Date("2026-01-10T14:00:00.000Z"),
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
		dtStart: new Date("2026-02-17T16:30:00.000Z"),
		dtEnd: new Date("2026-02-17T17:30:00.000Z"),
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

	const clientColumns = await sql<{ column_name: string }[]>`
		select column_name
		from information_schema.columns
		where table_name = 'clients'
	`;

	const hasAccountIdColumn = clientColumns.some(
		(column) => column.column_name === "account_id",
	);

	try {
		// Hash passwords for accounts
		const accountsWithHashedPasswords: NewAccount[] = await Promise.all([
			{
				id: accountIds.joanaAccount,
				name: "Joana Silva",
				taxId: "12345678900",
				cellphone: "+55 (11) 98888-1111",
				storeId: storeIds.matriz,
				passwordHash: await Bun.password.hash("senha@123"),
			},
			{
				id: accountIds.carlosAccount,
				name: "Carlos Souza",
				taxId: "98765432100",
				cellphone: "+55 (11) 97777-2222",
				storeId: storeIds.moema,
				passwordHash: await Bun.password.hash("senha@456"),
			},
			{
				id: accountIds.marinaAccount,
				name: "Marina Lima",
				taxId: "11223344567",
				cellphone: "+55 (11) 96666-3333",
				storeId: storeIds.matriz,
				passwordHash: await Bun.password.hash("senha@789"),
			},
		]);

		const accountById = new Map(
			accountsWithHashedPasswords.map((account) => [account.id, account]),
		);

		await db.transaction(async (tx) => {
			await tx.delete(appointmentOverrides);
			await tx.delete(appointmentExdates);
			await tx.delete(appointments);
			await tx.delete(professionals);
			await tx.delete(clients);
			await tx.delete(accounts);
			await tx.delete(stores);

			await tx.insert(stores).values(storesSeedData);
			await tx.insert(accounts).values(accountsWithHashedPasswords);
			await tx.insert(professionals).values(professionalsSeedData);

			if (hasAccountIdColumn) {
				await tx.insert(clients).values(clientsSeedData);
			} else {
				for (const client of clientsSeedData) {
					const account = accountById.get(client.accountId);

					if (
						!account ||
						!account.id ||
						!account.name ||
						!account.cellphone ||
						!account.storeId
					) {
						continue;
					}

					await tx.execute(
						drizzleSql`
							insert into clients (id, name, tax_id, cellphone, store_id)
							values (${client.id}, ${account.name}, ${account.taxId}, ${account.cellphone}, ${account.storeId})
						`,
					);
				}
			}

			await tx.insert(appointments).values(appointmentsSeedData);
			await tx.insert(appointmentExdates).values(appointmentExdatesSeedData);
			await tx
				.insert(appointmentOverrides)
				.values(appointmentOverridesSeedData);
		});

		logger.info("Database seed completed", {
			stores: storesSeedData.length,
			clients: clientsSeedData.length,
			professionals: professionalsSeedData.length,
			accounts: accountsWithHashedPasswords.length,
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
