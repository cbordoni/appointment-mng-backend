import { Elysia } from "elysia";

import { requireAuth } from "@/common/http/auth.middleware";
import { PaginationQuerySchema, StoreHeaderSchema } from "@/common/types";
import { controller } from ".";
import { ClientIdSchema, CreateClientSchema } from "./client.types";

export const clientRoutes = new Elysia({ prefix: "/clients" })
	.use(requireAuth)
	.get(
		"/",
		async ({ query, headers }) => {
			return await controller.getAll(query, headers["x-store-id"]);
		},
		{
			query: PaginationQuerySchema,
			headers: StoreHeaderSchema,
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
