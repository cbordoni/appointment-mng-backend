import { Elysia } from "elysia";

import { PaginationQuerySchema, StoreHeaderSchema } from "@/common/types";
import { controller } from ".";
import {
	CreateProfessionalSchema,
	ProfessionalIdSchema,
	UpdateProfessionalSchema,
} from "./professional.types";

export const professionalRoutes = new Elysia({ prefix: "/professionals" })
	.get(
		"/",
		async ({ query, headers }) => {
			return await controller.getAll(query, headers["x-store-id"]);
		},
		{
			query: PaginationQuerySchema,
			headers: StoreHeaderSchema,
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
