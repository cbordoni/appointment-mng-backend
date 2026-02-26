import { describe, expect, it } from "bun:test";

import { HealthRepositoryMock } from "./health.repository.mock";
import { HealthService } from "./health.service";

describe("HealthService", () => {
	const repository = new HealthRepositoryMock();
	const healthService = new HealthService(repository);

	describe("checkHealth", () => {
		it("should return ok status when database is connected", async () => {
			repository.setShouldFail(false);
			repository.setLatency(5);

			const result = await healthService.checkHealth();

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				const health = result.value;
				expect(health.status).toBe("ok");
				expect(health.database.connected).toBe(true);
				expect(health.database.latency).toBe(5);
				expect(health.timestamp).toBeDefined();
			}
		});

		it("should return error status when database is disconnected", async () => {
			repository.setShouldFail(true);

			const result = await healthService.checkHealth();

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				const health = result.error;
				expect(health.message).toBeDefined();
			}
		});

		it("should include valid ISO timestamp", async () => {
			repository.setShouldFail(false);

			const result = await healthService.checkHealth();

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				const health = result.value;
				const timestamp = new Date(health.timestamp);
				expect(timestamp).toBeInstanceOf(Date);
				expect(timestamp.getTime()).not.toBeNaN();
			}
		});

		it("should measure database latency", async () => {
			repository.setShouldFail(false);
			repository.setLatency(10);

			const result = await healthService.checkHealth();

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				const health = result.value;

				if (health.database.connected) {
					expect(health.database.latency).toBeDefined();
					expect(typeof health.database.latency).toBe("number");
					expect(health.database.latency).toBe(10);
				}
			}
		});
	});
});
