import { Elysia } from "elysia";

import { requireAuth } from "@/common/http/auth.middleware";
import { controller } from ".";
import { AppointmentProjectionQuerySchema } from "./appointment-projection.types";

export const appointmentProjectionRoutes = new Elysia({
	prefix: "/appointment-projections",
})
	.use(requireAuth)
	.get(
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
