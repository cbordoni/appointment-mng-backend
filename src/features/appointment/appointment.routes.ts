import { Elysia, t } from "elysia";

import { PaginationQuerySchema } from "@/common/types";

import { AppointmentController } from "./appointment.controller";
import { BullMqAppointmentNotificationScheduler } from "./appointment.notification.scheduler";
import { AppointmentRepository } from "./appointment.repository";
import { AppointmentService } from "./appointment.service";
import {
	AppointmentIdSchema,
	CreateAppointmentSchema,
	DateRangeQuerySchema,
	UpdateAppointmentSchema,
} from "./appointment.types";

const repository = new AppointmentRepository();
const notificationScheduler = new BullMqAppointmentNotificationScheduler();
const service = new AppointmentService(repository, notificationScheduler);
const controller = new AppointmentController(service);

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
		"/user/:userId",
		async ({ params, query }) => {
			return await controller.getAllByUserId(params.userId, query);
		},
		{
			params: t.Object({ userId: t.String({ format: "uuid" }) }),
			query: PaginationQuerySchema,
			detail: {
				summary: "Get appointments by user ID",
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
