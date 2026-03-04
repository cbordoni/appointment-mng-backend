import { Elysia } from "elysia";

import { PaginationQuerySchema } from "@/common/types";
import { ClientController } from "./client.controller";
import { ClientRepository } from "./client.repository";
import { ClientService } from "./client.service";
import {
	ClientIdSchema,
	CreateClientSchema,
	UpdateClientSchema,
} from "./client.types";

const repository = new ClientRepository();
const service = new ClientService(repository);
const controller = new ClientController(service);

export const clientRoutes = new Elysia({ prefix: "/clients" })
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
