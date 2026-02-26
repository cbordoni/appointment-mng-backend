import { err, ok, type Result } from "neverthrow";

import { DatabaseError, type DomainError } from "@/common/errors";

import type { IHealthRepository } from "./health.repository.interface";

export class HealthRepositoryMock implements IHealthRepository {
	private shouldFail = false;
	private latency = 5;

	setLatency(latency: number): void {
		this.latency = latency;
	}

	setShouldFail(shouldFail: boolean): void {
		this.shouldFail = shouldFail;
	}

	async checkDatabaseConnection(): Promise<Result<number, DomainError>> {
		if (this.shouldFail) {
			return err(new DatabaseError("Database connection failed"));
		}

		return ok(this.latency);
	}
}
