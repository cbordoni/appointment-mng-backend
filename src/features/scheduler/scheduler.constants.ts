import IORedis from "ioredis";

import type { SchedulingWindow } from "./scheduler.types";

export function createRedisConnection() {
	return new IORedis({
		host: Bun.env.REDIS_HOST ?? "127.0.0.1",
		port: Number(Bun.env.REDIS_PORT ?? 6379),
		password: Bun.env.REDIS_PASSWORD,
		maxRetriesPerRequest: null,
	});
}

const HOUR_IN_MS = 60 * 60 * 1000;

export const NOTIFICATION_WINDOWS: SchedulingWindow[] = [
	{ type: "1h", offset: HOUR_IN_MS },
	{ type: "24h", offset: 24 * HOUR_IN_MS },
] as const;

export const APPOINTMENT_NOTIFICATION_QUEUE = "appointment-notifications";
