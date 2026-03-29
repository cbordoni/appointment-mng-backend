import { t } from "elysia";

export const StoreHeaderSchema = t.Object({
	"x-store-id": t.String({ format: "uuid" }),
});

export type StoreHeader = typeof StoreHeaderSchema.static;
