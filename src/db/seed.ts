import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { logger } from "@/common/logger";
import {
  appointments,
  type NewAppointment,
  type NewUser,
  users,
} from "@/db/schema";

const connectionString = Bun.env.DATABASE_URL;

const usersSeedData: NewUser[] = [
  {
    id: "15f968f6-df8a-42b4-b2f4-82f6e82395f1",
    name: "Joana Silva",
    email: "joana.silva@appointment.com",
    cellphone: "+55 (11) 98888-1111",
    role: "admin" as const,
  },
  {
    id: "3d8f4aa7-e27e-4eb8-b6e7-4f0f2f89014f",
    name: "Carlos Souza",
    email: "carlos.souza@appointment.com",
    cellphone: "+55 (11) 97777-2222",
    role: "customer" as const,
  },
  {
    id: "d64af340-9207-4627-8f76-02b55309b475",
    name: "Marina Lima",
    email: "marina.lima@appointment.com",
    cellphone: "+55 (11) 96666-3333",
    role: "customer" as const,
  },
] as const;

const appointmentsSeedData: NewAppointment[] = [
  {
    id: "2b412040-79eb-4826-8e5a-eb7d58fef214",
    title: "Sessão inicial",
    startDate: new Date("2026-03-03T14:00:00.000Z"),
    endDate: new Date("2026-03-03T15:00:00.000Z"),
    observation: "Primeira conversa para entender objetivos terapêuticos.",
    // biome-ignore lint: lint/style/noNullAssertion
    userId: usersSeedData[1].id!,
  },
  {
    id: "44a4bd5c-68e4-44d4-b458-a75f12a95239",
    title: "Acompanhamento mensal",
    startDate: new Date("2026-03-10T13:00:00.000Z"),
    endDate: new Date("2026-03-10T14:00:00.000Z"),
    observation: "Revisão de evolução e ajuste de plano terapêutico.",
    // biome-ignore lint: lint/style/noNullAssertion
    userId: usersSeedData[2].id!,
  },
  {
    id: "c7f2665d-a7dd-45f9-9ff3-262d7e6549fd",
    title: "Sessão de retorno",
    startDate: new Date("2026-03-17T16:30:00.000Z"),
    endDate: new Date("2026-03-17T17:30:00.000Z"),
    observation: "Retorno focado em estratégias para rotina semanal.",
    // biome-ignore lint: lint/style/noNullAssertion
    userId: usersSeedData[1].id!,
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
      await tx.delete(appointments);
      await tx.delete(users);

      await tx.insert(users).values(usersSeedData);
      await tx.insert(appointments).values(appointmentsSeedData);
    });

    logger.info("Database seed completed", {
      users: usersSeedData.length,
      appointments: appointmentsSeedData.length,
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
