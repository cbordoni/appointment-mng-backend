import { Elysia } from "elysia";

import { requireAuth } from "@/common/http/auth.middleware";
import { PaginationQuerySchema } from "@/common/types";
import { controller } from ".";
import {
	AppointmentExceptionIdSchema,
	CreateAppointmentExceptionSchema,
	UpdateAppointmentExceptionSchema,
} from "./appointment-exception.types";

export const appointmentExceptionRoutes = new Elysia({
	prefix: "/appointment-exceptions",
})
	.use(requireAuth)
	.get(
		"/",
		async ({ query }) => {
			return await controller.getAll(query);
		},
		{
			query: PaginationQuerySchema,
			detail: {
				summary: "Get all appointment exceptions with pagination",
				tags: ["AppointmentExceptions"],
			},
		},
	)
	.get(
		"/:id",
		async ({ params }) => {
			return await controller.getById(params.id);
		},
		{
			params: AppointmentExceptionIdSchema,
			detail: {
				summary: "Get appointment exception by ID",
				tags: ["AppointmentExceptions"],
			},
		},
	)
	.post(
		"/",
		async ({ body }) => {
			return await controller.create(body);
		},
		{
			body: CreateAppointmentExceptionSchema,
			detail: {
				summary: "Create a new appointment exception",
				tags: ["AppointmentExceptions"],
			},
		},
	)
	.patch(
		"/:id",
		async ({ params, body }) => {
			return await controller.update(params.id, body);
		},
		{
			params: AppointmentExceptionIdSchema,
			body: UpdateAppointmentExceptionSchema,
			detail: {
				summary: "Update an appointment exception",
				tags: ["AppointmentExceptions"],
			},
		},
	)
	.delete(
		"/:id",
		async ({ params }) => {
			return await controller.delete(params.id);
		},
		{
			params: AppointmentExceptionIdSchema,
			detail: {
				summary: "Delete an appointment exception",
				tags: ["AppointmentExceptions"],
			},
		},
	);
