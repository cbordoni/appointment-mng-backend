import { Elysia } from "elysia";

import {
	AppointmentIdSchema,
	CreateAppointmentEventSchema,
} from "../appointment.types";
import { controller } from ".";

export const buildAppointmentEventRoutes = () =>
	new Elysia()
		.get(
			"/:id/events",
			async ({ params }) => {
				return await controller.getEventsByAppointmentId(params.id);
			},
			{
				params: AppointmentIdSchema,
				detail: {
					summary: "Get appointment events by appointment ID",
					tags: ["Appointments"],
				},
			},
		)
		.post(
			"/:id/events",
			async ({ params, body }) => {
				return await controller.createEvent(params.id, body);
			},
			{
				params: AppointmentIdSchema,
				body: CreateAppointmentEventSchema,
				detail: {
					summary: "Create event history for appointment",
					tags: ["Appointments"],
				},
			},
		);
