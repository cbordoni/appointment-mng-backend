import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";

import { errorLoggerPlugin } from "@/common/http/error-logger.plugin";
import { httpErrorMapperPlugin } from "@/common/http/http-error-mapper.plugin";
import { requestLoggerPlugin } from "@/common/http/request-logger.plugin";
import { appointmentRoutes } from "@/features/appointment/appointment.routes";
import { healthRoutes } from "@/features/health/health.routes";
import { userRoutes } from "@/features/user/user.routes";

const version = Bun.env.npm_package_version ?? "1.0.0";

export const app = new Elysia()
	.use(cors())
	.use(requestLoggerPlugin)
	.use(httpErrorMapperPlugin)
	.use(errorLoggerPlugin)
	.use(
		openapi({
			path: "/docs",
			documentation: {
				info: {
					title: "API Documentation",
					version,
					description: "A modern backend API built with Bun and Elysia",
				},
				tags: [
					{ name: "Users", description: "User management endpoints" },
					{
						name: "Appointments",
						description: "Appointment management endpoints",
					},
				],
			},
		}),
	)
	.get("/", () => ({ message: "API Root" }), {
		detail: {
			summary: "API Root",
			tags: ["Health"],
		},
	})
	.use(healthRoutes)
	.use(userRoutes)
	.use(appointmentRoutes);
