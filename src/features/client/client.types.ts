import { t } from "elysia";

export const CreateClientSchema = t.Object({
	name: t.String({ minLength: 1 }),
	cellphone: t.String({ minLength: 10, maxLength: 15 }),
	taxId: t.Optional(t.String({ minLength: 9, maxLength: 15 })),
	storeId: t.String({ format: "uuid" }),
});

export const UpdateClientSchema = t.Object({
	name: t.Optional(t.String({ minLength: 1 })),
	cellphone: t.Optional(t.String({ minLength: 10, maxLength: 15 })),
	taxId: t.Optional(t.String({ minLength: 9, maxLength: 15 })),
});

export const ClientIdSchema = t.Object({
	id: t.String({ format: "uuid" }),
});

export type CreateClientInput = typeof CreateClientSchema.static;
export type UpdateClientInput = typeof UpdateClientSchema.static;
export type ClientIdInput = typeof ClientIdSchema.static;
