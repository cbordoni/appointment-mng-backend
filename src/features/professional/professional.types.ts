import { t } from "elysia";

export const CreateProfessionalSchema = t.Object({
	accountId: t.String({ format: "uuid" }),
});

export const UpdateProfessionalSchema = t.Object({
	accountId: t.Optional(t.String({ format: "uuid" })),
});

export const ProfessionalIdSchema = t.Object({
	id: t.String({ format: "uuid" }),
});

export type CreateProfessionalInput = typeof CreateProfessionalSchema.static;
export type UpdateProfessionalInput = typeof UpdateProfessionalSchema.static;
export type ProfessionalIdInput = typeof ProfessionalIdSchema.static;
