import { Elysia } from "elysia";

import { requireAuth } from "@/common/http/auth.middleware";
import { PaginationQuerySchema, StoreHeaderSchema } from "@/common/types";
import { controller } from ".";
import {
	AppointmentOverrideIdSchema,
	CreateAppointmentOverrideSchema,
	UpdateAppointmentOverrideSchema,
} from "./appointment-override.types";

export const appointmentOverrideRoutes = new Elysia({
	prefix: "/appointment-overrides",
})
	.use(requireAuth)
	.get(
		"/",
		async ({ query }) => {
			return await controller.getAll(query);
		},
		{
			query: PaginationQuerySchema,
			headers: StoreHeaderSchema,
			detail: {
				summary: "Get all appointment overrides with pagination",
				tags: ["AppointmentOverrides"],
			},
		},
	)
	.get(
		"/:id",
		async ({ params }) => {
			return await controller.getById(params.id);
		},
		{
			params: AppointmentOverrideIdSchema,
			detail: {
				summary: "Get appointment override by ID",
				tags: ["AppointmentOverrides"],
			},
		},
	)
	.post(
		"/",
		async ({ body }) => {
			return await controller.create(body);
		},
		{
			body: CreateAppointmentOverrideSchema,
			detail: {
				summary: "Create a new appointment override",
				tags: ["AppointmentOverrides"],
			},
		},
	)
	.patch(
		"/:id",
		async ({ params, body }) => {
			return await controller.update(params.id, body);
		},
		{
			params: AppointmentOverrideIdSchema,
			body: UpdateAppointmentOverrideSchema,
			detail: {
				summary: "Update an appointment override",
				tags: ["AppointmentOverrides"],
			},
		},
	)
	.delete(
		"/:id",
		async ({ params }) => {
			return await controller.delete(params.id);
		},
		{
			params: AppointmentOverrideIdSchema,
			detail: {
				summary: "Delete an appointment override",
				tags: ["AppointmentOverrides"],
			},
		},
	);
