import { t } from "elysia";

export const CreateClientSchema = t.Object({
	name: t.String({ minLength: 1 }),
	email: t.String({ format: "email" }),
	cellphone: t.String({ minLength: 10, maxLength: 15 }),
});

export const UpdateClientSchema = t.Object({
	name: t.Optional(t.String({ minLength: 1 })),
	email: t.Optional(t.String({ format: "email" })),
	cellphone: t.Optional(t.String({ minLength: 10, maxLength: 15 })),
});

export const ClientIdSchema = t.Object({
	id: t.String({ format: "uuid" }),
});

export type CreateClientInput = typeof CreateClientSchema.static;
export type UpdateClientInput = typeof UpdateClientSchema.static;
export type ClientIdInput = typeof ClientIdSchema.static;
