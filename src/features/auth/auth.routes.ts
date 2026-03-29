import { Elysia } from "elysia";

import { LoginSchema } from "./auth.types";
import { controller } from "./index";

export const authRoutes = new Elysia({ prefix: "/auth" }).post(
	"/login",
	async ({ body }) => {
		return await controller.login(body);
	},
	{
		body: LoginSchema,
		detail: {
			summary: "Authenticate user with taxId and password",
			tags: ["Authentication"],
			description:
				"Authenticates a user by taxId and password, returning account information",
		},
	},
);
