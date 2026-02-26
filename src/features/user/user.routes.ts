import { Elysia } from "elysia";

import { PaginationQuerySchema } from "@/common/types";
import { UserController } from "./user.controller";
import { UserRepository } from "./user.repository";
import { UserService } from "./user.service";
import { CreateUserSchema, UpdateUserSchema, UserIdSchema } from "./user.types";

const repository = new UserRepository();
const service = new UserService(repository);
const controller = new UserController(service);

export const userRoutes = new Elysia({ prefix: "/users" })
	.get(
		"/",
		async ({ query }) => {
			return await controller.getAll(query);
		},
		{
			query: PaginationQuerySchema,
			detail: {
				summary: "Get all users with pagination",
				tags: ["Users"],
			},
		},
	)
	.get(
		"/:id",
		async ({ params }) => {
			return await controller.getById(params.id);
		},
		{
			params: UserIdSchema,
			detail: {
				summary: "Get user by ID",
				tags: ["Users"],
			},
		},
	)
	.post(
		"/",
		async ({ body }) => {
			return await controller.create(body);
		},
		{
			body: CreateUserSchema,
			detail: {
				summary: "Create a new user",
				tags: ["Users"],
			},
		},
	)
	.patch(
		"/:id",
		async ({ params, body }) => {
			return await controller.update(params.id, body);
		},
		{
			params: UserIdSchema,
			body: UpdateUserSchema,
			detail: {
				summary: "Update a user",
				tags: ["Users"],
			},
		},
	)
	.delete(
		"/:id",
		async ({ params }) => {
			return await controller.delete(params.id);
		},
		{
			params: UserIdSchema,
			detail: {
				summary: "Delete a user",
				tags: ["Users"],
			},
		},
	);
