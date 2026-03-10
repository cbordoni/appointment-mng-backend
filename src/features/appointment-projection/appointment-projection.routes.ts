import { Elysia } from "elysia";

import { controller } from ".";
import { AppointmentProjectionQuerySchema } from "./appointment-projection.types";

export const appointmentProjectionRoutes = new Elysia({
	prefix: "/appointment-projections",
}).get(
	"/",
	async ({ query }) => {
		return await controller.getByRange(query);
	},
	{
		query: AppointmentProjectionQuerySchema,
		detail: {
			summary: "Project appointments by date range",
			tags: ["AppointmentProjections"],
		},
	},
);
