import { Elysia } from "elysia";

import { requireAuth } from "@/common/http/auth.middleware";
import { PaginationQuerySchema, StoreHeaderSchema } from "@/common/types";

import { controller } from ".";
import {
	AccountIdSchema,
	CreateAccountSchema,
	UpdateAccountSchema,
} from "./account.types";

export const accountRoutes = new Elysia({ prefix: "/accounts" })
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
				summary: "Get all accounts with pagination",
				tags: ["Accounts"],
			},
		},
	)
	.get(
		"/:id",
		async ({ params }) => {
			return await controller.getById(params.id);
		},
		{
			params: AccountIdSchema,
			detail: {
				summary: "Get account by ID",
				tags: ["Accounts"],
			},
		},
	)
	.post(
		"/",
		async ({ body }) => {
			return await controller.create(body);
		},
		{
			body: CreateAccountSchema,
			detail: {
				summary: "Create a new account",
				tags: ["Accounts"],
			},
		},
	)
	.patch(
		"/:id",
		async ({ params, body }) => {
			return await controller.update(params.id, body);
		},
		{
			params: AccountIdSchema,
			body: UpdateAccountSchema,
			detail: {
				summary: "Update an account",
				tags: ["Accounts"],
			},
		},
	)
	.delete(
		"/:id",
		async ({ params }) => {
			return await controller.delete(params.id);
		},
		{
			params: AccountIdSchema,
			detail: {
				summary: "Delete an account",
				tags: ["Accounts"],
			},
		},
	);
