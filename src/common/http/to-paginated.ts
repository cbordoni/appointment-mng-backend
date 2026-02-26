import type { PaginatedResponse, PaginatedResult } from "@/common/types";

export function toPaginated<T>(
	{ items: data, total }: PaginatedResult<T>,
	page: number,
	limit: number,
): PaginatedResponse<T> {
	return {
		data,
		meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
	};
}
