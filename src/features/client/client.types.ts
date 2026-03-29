import { t } from "elysia";

export const CreateClientSchema = t.Object({
	accountId: t.String({ format: "uuid" }),
});

export const ClientIdSchema = t.Object({
	id: t.String({ format: "uuid" }),
});

export type CreateClientInput = typeof CreateClientSchema.static;
export type ClientIdInput = typeof ClientIdSchema.static;
