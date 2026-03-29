import type { Elysia } from "elysia";

import { logger } from "@/common/logger";

import { JWTService, type JWTPayload } from "./jwt.service";

const jwtService = new JWTService();

export interface AuthContext {
	user: JWTPayload;
}

export const requireAuth = (app: Elysia) => {
	return app.onBeforeHandle(async ({ headers, set }) => {
		const authHeader = headers["authorization"];

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			logger.warn("Missing or invalid authorization header");
			set.status = 401;
			return {
				code: "UNAUTHORIZED",
				message: "Missing or invalid authorization header",
			};
		}

		const token = authHeader.slice(7);
		const payload = await jwtService.verify(token);

		if (!payload) {
			logger.warn("Invalid or expired token");
			set.status = 401;
			return {
				code: "UNAUTHORIZED",
				message: "Invalid or expired token",
			};
		}

		return {
			auth: { user: payload },
		};
	});
};
