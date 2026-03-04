import { Elysia } from "elysia";

import { PaginationQuerySchema } from "@/common/types";
import { ProfessionalController } from "./professional.controller";
import { ProfessionalRepository } from "./professional.repository";
import { ProfessionalService } from "./professional.service";
import {
	CreateProfessionalSchema,
	ProfessionalIdSchema,
	UpdateProfessionalSchema,
} from "./professional.types";

const repository = new ProfessionalRepository();
const service = new ProfessionalService(repository);
const controller = new ProfessionalController(service);

export const professionalRoutes = new Elysia({ prefix: "/professionals" })
	.get(
		"/",
		async ({ query }) => {
			return await controller.getAll(query);
		},
		{
			query: PaginationQuerySchema,
			detail: {
				summary: "Get all professionals with pagination",
				tags: ["Professionals"],
			},
		},
	)
	.get(
		"/:id",
		async ({ params }) => {
			return await controller.getById(params.id);
		},
		{
			params: ProfessionalIdSchema,
			detail: {
				summary: "Get professional by ID",
				tags: ["Professionals"],
			},
		},
	)
	.post(
		"/",
		async ({ body }) => {
			return await controller.create(body);
		},
		{
			body: CreateProfessionalSchema,
			detail: {
				summary: "Create a new professional",
				tags: ["Professionals"],
			},
		},
	)
	.patch(
		"/:id",
		async ({ params, body }) => {
			return await controller.update(params.id, body);
		},
		{
			params: ProfessionalIdSchema,
			body: UpdateProfessionalSchema,
			detail: {
				summary: "Update a professional",
				tags: ["Professionals"],
			},
		},
	)
	.delete(
		"/:id",
		async ({ params }) => {
			return await controller.delete(params.id);
		},
		{
			params: ProfessionalIdSchema,
			detail: {
				summary: "Delete a professional",
				tags: ["Professionals"],
			},
		},
	);
