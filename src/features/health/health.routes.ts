import { Elysia } from "elysia";

import { healthController } from "./health.controller";

export const healthRoutes = new Elysia({ prefix: "/health" }).get(
	"/",
	() => healthController.check(),
	{
		detail: {
			summary: "Health Check",
			description: "Check API and database health status",
			tags: ["Health"],
		},
	},
);
