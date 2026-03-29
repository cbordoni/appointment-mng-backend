import { Elysia } from "elysia";

import { PaginationQuerySchema, StoreHeaderSchema } from "@/common/types";
import { controller } from ".";
import {
	ClientIdSchema,
	CreateClientSchema,
	UpdateClientSchema,
} from "./client.types";

export const clientRoutes = new Elysia({ prefix: "/clients" })
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
	.get(
		"/:id",
		async ({ params }) => {
			return await controller.getById(params.id);
		},
		{
			params: ClientIdSchema,
			detail: {
				summary: "Get client by ID",
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
	.patch(
		"/:id",
		async ({ params, body }) => {
			return await controller.update(params.id, body);
		},
		{
			params: ClientIdSchema,
			body: UpdateClientSchema,
			detail: {
				summary: "Update a client",
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
