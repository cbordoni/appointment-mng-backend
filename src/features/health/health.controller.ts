import { HttpErrorResponse } from "@/common/errors";
import { HealthRepository } from "./health.repository";
import { HealthService } from "./health.service";

const healthRepository = new HealthRepository();
const healthService = new HealthService(healthRepository);

class HealthController {
	async check() {
		const result = await healthService.checkHealth();

		return result.mapErr(
			() =>
				new HttpErrorResponse(
					"Health check failed",
					"HEALTH_CHECK_FAILED",
					500,
				),
		);
	}
}

export const healthController = new HealthController();
