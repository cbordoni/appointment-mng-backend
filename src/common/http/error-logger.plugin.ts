import { Elysia } from "elysia";

import { HttpErrorResponse } from "@/common/errors";
import { logger } from "@/common/logger";

export const errorLoggerPlugin = new Elysia({
	name: "error-logger",
}).onError(({ code, error, request: { method, url } }) => {
	const message =
		error instanceof HttpErrorResponse ? error.message : String(error);

	logger.error("Request error", { message, code, method, url });
});
