import { beforeEach, describe, expect, it } from "bun:test";

import { ValidationError } from "@/common/errors";

import { MockAuthRepository } from "./auth.repository.mock";
import { AuthService } from "./auth.service";
import type { LoginInput } from "./auth.types";

describe("AuthService", () => {
	let authService: AuthService;
	let mockRepository: MockAuthRepository;

	beforeEach(() => {
		mockRepository = new MockAuthRepository();
		authService = new AuthService(mockRepository);
	});

	describe("login", () => {
		it("should return auth payload on successful login", async () => {
			const passwordHash = await Bun.password.hash("password123");
			mockRepository.setAccounts([
				{
					id: "account-001",
					name: "John Doe",
					taxId: "12345678901",
					cellphone: "11999999999",
					passwordHash,
					storeId: "store-001",
					deletedAt: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			]);

			const input: LoginInput = {
				taxId: "12345678901",
				password: "password123",
			};

			const result = await authService.login(input);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				const payload = result.value;

				expect(payload.accountId).toBe("account-001");
				expect(payload.taxId).toBe("12345678901");
				expect(payload.name).toBe("John Doe");
			}
		});

		it("should return validation error with invalid credentials", async () => {
			const passwordHash = await Bun.password.hash("password123");
			mockRepository.setAccounts([
				{
					id: "account-001",
					name: "John Doe",
					taxId: "12345678901",
					cellphone: "11999999999",
					passwordHash,
					storeId: "store-001",
					deletedAt: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			]);

			const input: LoginInput = {
				taxId: "12345678901",
				password: "wrongpassword",
			};

			const result = await authService.login(input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Invalid credentials");
			}
		});

		it("should return validation error when account not found", async () => {
			mockRepository.setAccounts([]);

			const input: LoginInput = {
				taxId: "99999999999",
				password: "password123",
			};

			const result = await authService.login(input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Invalid credentials");
			}
		});

		it("should return validation error with empty taxId", async () => {
			const input: LoginInput = {
				taxId: "",
				password: "password123",
			};

			const result = await authService.login(input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
			}
		});

		it("should return validation error with invalid password length", async () => {
			const input: LoginInput = {
				taxId: "12345678901",
				password: "short",
			};

			const result = await authService.login(input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
			}
		});
	});
});
