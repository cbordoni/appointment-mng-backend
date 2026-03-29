import { beforeAll, describe, expect, it } from "bun:test";
import { Elysia } from "elysia";

let requireAuth: typeof import("./auth.middleware").requireAuth;
let jwtService: InstanceType<typeof import("./jwt.service").JWTService>;

beforeAll(async () => {
	Bun.env.JWT_SECRET = "test-secret";

	const middlewareModule = await import("./auth.middleware");
	const jwtModule = await import("./jwt.service");

	requireAuth = middlewareModule.requireAuth;
	jwtService = new jwtModule.JWTService();
});

const createToken = async (storeId: string) => {
	return await jwtService.sign({
		accountId: "account-001",
		taxId: "12345678900",
		name: "Joana Silva",
		storeId,
	});
};

const createProtectedApp = () => {
	return new Elysia()
		.use(requireAuth)
		.get("/stores/:storeId", () => {
			return { ok: true };
		})
		.get("/profile", () => {
			return { ok: true };
		});
};

describe("requireAuth", () => {
	it("should allow request when route storeId matches token storeId", async () => {
		const app = createProtectedApp();
		const token = await createToken("store-001");

		const response = await app.handle(
			new Request("http://localhost/stores/store-001", {
				headers: {
					authorization: `Bearer ${token}`,
				},
			}),
		);

		expect(response.status).toBe(200);
	});

	it("should return 403 when route storeId differs from token storeId", async () => {
		const app = createProtectedApp();
		const token = await createToken("store-001");

		const response = await app.handle(
			new Request("http://localhost/stores/store-999", {
				headers: {
					authorization: `Bearer ${token}`,
				},
			}),
		);

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({
			code: "FORBIDDEN",
			message: "You are not allowed to access this store",
		});
	});

	it("should allow request when route has no storeId param", async () => {
		const app = createProtectedApp();
		const token = await createToken("store-001");

		const response = await app.handle(
			new Request("http://localhost/profile", {
				headers: {
					authorization: `Bearer ${token}`,
				},
			}),
		);

		expect(response.status).toBe(200);
	});

	it("should return 401 when authorization header is missing", async () => {
		const app = createProtectedApp();

		const response = await app.handle(
			new Request("http://localhost/stores/store-001"),
		);

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({
			code: "UNAUTHORIZED",
			message: "Missing or invalid authorization header",
		});
	});
});
