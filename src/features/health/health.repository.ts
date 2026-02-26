import { err, ok, type Result } from "neverthrow";

import { DatabaseError, type DomainError } from "@/common/errors";
import { db } from "@/db";

import type { IHealthRepository } from "./health.repository.interface";

export class HealthRepository implements IHealthRepository {
	async checkDatabaseConnection(): Promise<Result<number, DomainError>> {
		const startTime = performance.now();

		// Simple query to check database connectivity
		return await db.execute("SELECT 1").then(
			() => ok(Math.round(performance.now() - startTime)),
			(e) =>
				err(
					new DatabaseError(
						e instanceof Error ? e.message : "Unknown database error",
					),
				),
		);
	}
}
