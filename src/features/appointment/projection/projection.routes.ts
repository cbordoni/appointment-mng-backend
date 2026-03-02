import { Elysia } from "elysia";

import { DateRangeQuerySchema } from "../appointment.types";
import { controller } from ".";

export const buildAppointmentProjectionRoutes = () =>
	new Elysia()
		.get(
			"/projections",
			async ({ query }) => {
				return await controller.getProjected(query);
			},
			{
				query: DateRangeQuerySchema,
				detail: {
					summary: "Get projected recurring appointments by date range",
					tags: ["Appointments"],
				},
			},
		)
		.get(
			"/calendar",
			async ({ query }) => {
				return await controller.getCalendar(query);
			},
			{
				query: DateRangeQuerySchema,
				detail: {
					summary: "Get calendar items (non-recurring + recurring projections)",
					tags: ["Appointments"],
				},
			},
		);
