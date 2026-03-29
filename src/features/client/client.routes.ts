import { Elysia } from "elysia";

import { requireAuth } from "@/common/http/auth.middleware";
import { PaginationQuerySchema } from "@/common/types";
import { controller } from ".";
import { ClientIdSchema, CreateClientSchema } from "./client.types";

export const clientRoutes = new Elysia({ prefix: "/clients" })
	.use(requireAuth)
	.get(
		"/",
		async ({ query }) => {
			return await controller.getAll(query);
		},
		{
			query: PaginationQuerySchema,
			detail: {
				summary: "Get all clients with pagination",
				tags: ["Clients"],
			},
		},
	)
	.post(
		"/",
		async ({ body }) => {
			return await controller.create(body);
		},
		{
			body: CreateClientSchema,
			detail: {
				summary: "Create a new client",
				tags: ["Clients"],
			},
		},
	)
	.delete(
		"/:id",
		async ({ params }) => {
			return await controller.delete(params.id);
		},
		{
			params: ClientIdSchema,
			detail: {
				summary: "Delete a client",
				tags: ["Clients"],
			},
		},
	);
