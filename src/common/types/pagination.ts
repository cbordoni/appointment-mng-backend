import { t } from "elysia";

export const PaginationQuerySchema = t.Object({
	page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
	limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 10 })),
});

export type PaginationQuery = typeof PaginationQuerySchema.static;

export interface PaginatedResponse<T> {
	data: T[];
	meta: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export interface PaginatedResult<T> {
	items: T[];
	total: number;
}
