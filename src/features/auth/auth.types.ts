import { t } from "elysia";

export const LoginSchema = t.Object({
	taxId: t.String({ minLength: 9, maxLength: 15 }),
	password: t.String({ minLength: 8 }),
});

export type LoginInput = typeof LoginSchema.static;

export type AuthPayload = {
	accountId: string;
	taxId: string;
	name: string;
};
