import { Elysia, t } from "elysia";

import { PaginationQuerySchema, StoreHeaderSchema } from "@/common/types";
import { controller } from ".";
import {
	AppointmentIdSchema,
	CreateAppointmentSchema,
	DateRangeQuerySchema,
	UpdateAppointmentSchema,
} from "./appointment.types";

export const appointmentRoutes = new Elysia({ prefix: "/appointments" })
	.get(
		"/",
		async ({ query }) => {
			return await controller.getAll(query);
		},
		{
			query: DateRangeQuerySchema,
			detail: {
				summary: "Get appointments filtered by date range",
				tags: ["Appointments"],
			},
		},
	)
	.get(
		"/client/:clientId",
		async ({ params, query, headers }) => {
			return await controller.getAllByClientId(
				params.clientId,
				query,
				headers["x-store-id"],
			);
		},
		{
			params: t.Object({ clientId: t.String({ format: "uuid" }) }),
			query: PaginationQuerySchema,
			headers: StoreHeaderSchema,
			detail: {
				summary: "Get appointments by client ID",
				tags: ["Appointments"],
			},
		},
	)
	.get(
		"/professional/:professionalId",
		async ({ params, query, headers }) => {
			return await controller.getAllByProfessionalId(
				params.professionalId,
				query,
				headers["x-store-id"],
			);
		},
		{
			params: t.Object({ professionalId: t.String({ format: "uuid" }) }),
			query: PaginationQuerySchema,
			headers: StoreHeaderSchema,
			detail: {
				summary: "Get appointments by professional ID",
				tags: ["Appointments"],
			},
		},
	)
	.get(
		"/:id",
		async ({ params }) => {
			return await controller.getById(params.id);
		},
		{
			params: AppointmentIdSchema,
			detail: {
				summary: "Get appointment by ID",
				tags: ["Appointments"],
			},
		},
	)
	.post(
		"/",
		async ({ body }) => {
			return await controller.create(body);
		},
		{
			body: CreateAppointmentSchema,
			detail: {
				summary: "Create a new appointment",
				tags: ["Appointments"],
			},
		},
	)
	.patch(
		"/:id",
		async ({ params, body }) => {
			return await controller.update(params.id, body);
		},
		{
			params: AppointmentIdSchema,
			body: UpdateAppointmentSchema,
			detail: {
				summary: "Update an appointment",
				tags: ["Appointments"],
			},
		},
	)
	.delete(
		"/:id",
		async ({ params }) => {
			return await controller.delete(params.id);
		},
		{
			params: AppointmentIdSchema,
			detail: {
				summary: "Delete an appointment",
				tags: ["Appointments"],
			},
		},
	);
