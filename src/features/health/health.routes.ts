import { Elysia } from "elysia";

import { requireAuth } from "@/common/http/auth.middleware";
import { healthController } from "./health.controller";

export const healthRoutes = new Elysia({ prefix: "/health" })
	.use(requireAuth)
	.get("/", () => healthController.check(), {
		detail: {
			summary: "Health Check",
			description: "Check API and database health status",
			tags: ["Health"],
		},
	});
