import type { Elysia } from "elysia";

import { logger } from "@/common/logger";

import { type JWTPayload, JWTService } from "./jwt.service";

const jwtService = new JWTService();

export interface AuthContext {
	user: JWTPayload;
}

export const requireAuth = (app: Elysia) => {
	return app
		.decorate("user", null as JWTPayload | null)
		.onBeforeHandle(async (context) => {
			const { headers, set } = context;

			const authorization =
				context.request.headers.get("authorization") ??
				headers["authorization"];

			if (!authorization || !authorization.startsWith("Bearer ")) {
				logger.warn("Missing or invalid authorization header");
				set.status = 401;

				return {
					code: "UNAUTHORIZED",
					message: "Missing or invalid authorization header",
				};
			}

			const [_, token] = authorization.split("Bearer ");
			const payload = await jwtService.verify(token);

			if (!payload) {
				logger.warn("Invalid or expired token");
				set.status = 401;

				return {
					code: "UNAUTHORIZED",
					message: "Invalid or expired token",
				};
			}

			const storeId =
				context.request.headers.get("x-store-id") ?? headers["x-store-id"];

			if (storeId && storeId !== payload.storeId) {
				logger.warn("Store access forbidden: x-store-id differs from token", {
					storeId,
					tokenStoreId: payload.storeId,
					accountId: payload.accountId,
				});

				set.status = 403;

				return {
					code: "FORBIDDEN",
					message: "You are not allowed to access this store",
				};
			}

			context.user = payload;
		});
};
