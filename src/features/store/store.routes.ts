import { Elysia } from "elysia";

import { requireAuth } from "@/common/http/auth.middleware";
import { SimplePaginationQuerySchema } from "@/common/types";
import { controller } from ".";
import {
	CreateStoreSchema,
	StoreIdSchema,
	UpdateStoreSchema,
} from "./store.types";

export const storeRoutes = new Elysia({ prefix: "/stores" })
	.use(requireAuth)
	.get(
		"/",
		async ({ query }) => {
			return await controller.getAll(query);
		},
		{
			query: SimplePaginationQuerySchema,
			detail: {
				summary: "Get all stores with pagination",
				tags: ["Stores"],
			},
		},
	)
	.get(
		"/:id",
		async ({ params }) => {
			return await controller.getById(params.id);
		},
		{
			params: StoreIdSchema,
			detail: {
				summary: "Get store by ID",
				tags: ["Stores"],
			},
		},
	)
	.post(
		"/",
		async ({ body }) => {
			return await controller.create(body);
		},
		{
			body: CreateStoreSchema,
			detail: {
				summary: "Create a new store",
				tags: ["Stores"],
			},
		},
	)
	.patch(
		"/:id",
		async ({ params, body }) => {
			return await controller.update(params.id, body);
		},
		{
			params: StoreIdSchema,
			body: UpdateStoreSchema,
			detail: {
				summary: "Update a store",
				tags: ["Stores"],
			},
		},
	)
	.delete(
		"/:id",
		async ({ params }) => {
			return await controller.delete(params.id);
		},
		{
			params: StoreIdSchema,
			detail: {
				summary: "Delete a store",
				tags: ["Stores"],
			},
		},
	);
