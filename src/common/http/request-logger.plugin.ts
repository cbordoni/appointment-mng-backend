import { Elysia } from "elysia";

import { logger } from "@/common/logger";

export const requestLoggerPlugin = new Elysia({
	name: "request-logger",
}).onRequest(({ request: { method, url } }) => {
	logger.info("Incoming request", { method, url });
});
