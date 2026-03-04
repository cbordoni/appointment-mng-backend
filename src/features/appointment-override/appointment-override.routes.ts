import { Elysia } from "elysia";

import { PaginationQuerySchema } from "@/common/types";
import { AppointmentOverrideController } from "./appointment-override.controller";
import { AppointmentOverrideRepository } from "./appointment-override.repository";
import { AppointmentOverrideService } from "./appointment-override.service";
import {
	AppointmentOverrideIdSchema,
	CreateAppointmentOverrideSchema,
	UpdateAppointmentOverrideSchema,
} from "./appointment-override.types";

const repository = new AppointmentOverrideRepository();
const service = new AppointmentOverrideService(repository);
const controller = new AppointmentOverrideController(service);

export const appointmentOverrideRoutes = new Elysia({
	prefix: "/appointment-overrides",
})
	.get(
		"/",
		async ({ query }) => {
			return await controller.getAll(query);
		},
		{
			query: PaginationQuerySchema,
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
