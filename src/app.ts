import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import prometheus from "elysia-prometheus";

import { errorLoggerPlugin } from "@/common/http/error-logger.plugin";
import { httpErrorMapperPlugin } from "@/common/http/http-error-mapper.plugin";
import { requestLoggerPlugin } from "@/common/http/request-logger.plugin";
import { accountRoutes } from "@/features/account/account.routes";
import { appointmentRoutes } from "@/features/appointment/appointment.routes";
import { appointmentExceptionRoutes } from "@/features/appointment-exception/appointment-exception.routes";
import { appointmentOverrideRoutes } from "@/features/appointment-override/appointment-override.routes";
import { appointmentProjectionRoutes } from "@/features/appointment-projection/appointment-projection.routes";
import { clientRoutes } from "@/features/client/client.routes";
import { healthRoutes } from "@/features/health/health.routes";
import { professionalRoutes } from "@/features/professional/professional.routes";
import { storeRoutes } from "./features/store/store.routes";

const version = Bun.env.npm_package_version ?? "1.0.0";

export const app = new Elysia()
	.use(cors())
	.use(requestLoggerPlugin)
	.use(httpErrorMapperPlugin)
	.use(errorLoggerPlugin)
	.use(prometheus())
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
					{ name: "Stores", description: "Store management endpoints" },
					{ name: "Accounts", description: "Account management endpoints" },
					{ name: "Clients", description: "Client management endpoints" },
					{
						name: "Professionals",
						description: "Professional management endpoints",
					},
					{
						name: "Appointments",
						description: "Appointment management endpoints",
					},
					{
						name: "AppointmentExceptions",
						description: "Appointment exception management endpoints",
					},
					{
						name: "AppointmentOverrides",
						description: "Appointment override management endpoints",
					},
					{
						name: "AppointmentProjections",
						description: "Projected appointment occurrences by date range",
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
	.use(storeRoutes)
	.use(accountRoutes)
	.use(clientRoutes)
	.use(professionalRoutes)
	.use(appointmentExceptionRoutes)
	.use(appointmentOverrideRoutes)
	.use(appointmentProjectionRoutes)
	.use(appointmentRoutes);
