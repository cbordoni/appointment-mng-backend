import { err, ok, type Result } from "neverthrow";

import { DomainError } from "@/common/errors";

import type { IHealthRepository } from "./health.repository.interface";
import type { HealthStatus } from "./health.types";

class HealthService {
	constructor(private readonly repository: IHealthRepository) {}

	async checkHealth(): Promise<Result<HealthStatus, DomainError>> {
		const result = await this.repository.checkDatabaseConnection();

		if (result.isErr()) {
			return err(
				new DomainError(
					`Database health check failed: ${result.error.message}`,
				),
			);
		}

		const latency = result.value;

		return ok({
			status: "ok",
			database: {
				connected: true,
				latency,
			},
			timestamp: new Date().toISOString(),
		});
	}
}

export { HealthService };
