import { t } from "elysia";

export const CreateProfessionalSchema = t.Object({
	name: t.String({ minLength: 1 }),
	taxId: t.String({ minLength: 11, maxLength: 18 }),
	phone: t.String({ minLength: 10, maxLength: 15 }),
});

export const UpdateProfessionalSchema = t.Object({
	name: t.Optional(t.String({ minLength: 1 })),
	taxId: t.Optional(t.String({ minLength: 11, maxLength: 18 })),
	phone: t.Optional(t.String({ minLength: 10, maxLength: 15 })),
});

export const ProfessionalIdSchema = t.Object({
	id: t.String({ format: "uuid" }),
});

export type CreateProfessionalInput = typeof CreateProfessionalSchema.static;
export type UpdateProfessionalInput = typeof UpdateProfessionalSchema.static;
export type ProfessionalIdInput = typeof ProfessionalIdSchema.static;
