import { t } from "elysia";

export const CreateStoreSchema = t.Object({
	name: t.String({ minLength: 1 }),
	taxId: t.String({ minLength: 14, maxLength: 18 }),
	email: t.String({ format: "email" }),
	cellphone: t.String({ minLength: 10, maxLength: 15 }),
});

export const UpdateStoreSchema = t.Object({
	name: t.Optional(t.String({ minLength: 1 })),
	taxId: t.Optional(t.String({ minLength: 14, maxLength: 18 })),
	email: t.Optional(t.String({ format: "email" })),
	cellphone: t.Optional(t.String({ minLength: 10, maxLength: 15 })),
});

export const StoreIdSchema = t.Object({
	id: t.String({ format: "uuid" }),
});

export type CreateStoreInput = typeof CreateStoreSchema.static;
export type UpdateStoreInput = typeof UpdateStoreSchema.static;
export type StoreIdInput = typeof StoreIdSchema.static;
