import { count, type SQL } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { fromPromise, type ResultAsync } from "neverthrow";

import { DatabaseError } from "@/common/errors";
import { db } from "@/db";

export async function wrapDatabaseOperation<T>(
	operation: () => Promise<T>,
	errorContext: string,
): Promise<ResultAsync<T, DatabaseError>> {
	return await fromPromise(
		operation(),
		(e) =>
			new DatabaseError(
				`${errorContext}: ${e instanceof Error ? e.message : "Unknown error"}`,
			),
	);
}

export async function getTableCount(
	table: PgTable,
	where?: SQL,
): Promise<number> {
	let query = db.select({ value: count() }).from(table);

	if (where) {
		query = query.where(where) as typeof query;
	}

	const [result] = await query;

	return Number(result?.value ?? 0);
}
