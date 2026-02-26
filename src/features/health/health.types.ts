export interface HealthStatus {
	status: "ok" | "degraded" | "error";
	database: {
		connected: boolean;
		latency?: number;
	};
	timestamp: string;
}
