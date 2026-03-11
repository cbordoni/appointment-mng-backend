import { t } from "elysia";

export const CreateAccountSchema = t.Object({
	name: t.String({ minLength: 1 }),
	taxId: t.Optional(t.String({ minLength: 9, maxLength: 15 })),
	cellphone: t.String({ minLength: 10, maxLength: 15 }),
	password: t.String({ minLength: 8 }),
	storeId: t.String({ format: "uuid" }),
});

export const UpdateAccountSchema = t.Object({
	name: t.Optional(t.String({ minLength: 1 })),
	taxId: t.Optional(t.String({ minLength: 9, maxLength: 15 })),
	cellphone: t.Optional(t.String({ minLength: 10, maxLength: 15 })),
	password: t.Optional(t.String({ minLength: 8 })),
});

export const AccountIdSchema = t.Object({
	id: t.String({ format: "uuid" }),
});

export type CreateAccountInput = typeof CreateAccountSchema.static;
export type UpdateAccountInput = typeof UpdateAccountSchema.static;
export type AccountIdInput = typeof AccountIdSchema.static;

export type CreateAccountRepositoryInput = Omit<
	CreateAccountInput,
	"password"
> & {
	passwordHash: string;
};

export type UpdateAccountRepositoryInput = Omit<
	UpdateAccountInput,
	"password"
> & {
	passwordHash?: string;
};
