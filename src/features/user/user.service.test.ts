import { beforeEach, describe, expect, it } from "bun:test";

import { ValidationError } from "@/common/errors";

import { MockUserRepository } from "./user.repository.mock";
import { UserService } from "./user.service";
import type { CreateUserInput, UpdateUserInput } from "./user.types";

describe("UserService", () => {
	let userService: UserService;
	let mockRepository: MockUserRepository;

	beforeEach(() => {
		mockRepository = new MockUserRepository();
		userService = new UserService(mockRepository);
	});

	describe("getAllUsers", () => {
		it("should return paginated users successfully", async () => {
			const mockUsers = [
				{
					id: "1",
					name: "John Doe",
					email: "john@example.com",
					cellphone: "1234567890",
					role: "customer" as const,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: "2",
					name: "Jane Doe",
					email: "jane@example.com",
					cellphone: "0987654321",
					role: "customer" as const,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			mockRepository.setUsers(mockUsers);

			const result = await userService.getAllUsers(1, 10);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				const response = result.value;
				expect(response.data).toHaveLength(2);
				expect(response.meta.page).toBe(1);
				expect(response.meta.limit).toBe(10);
				expect(response.meta.total).toBe(2);
				expect(response.meta.totalPages).toBe(1);
			}
		});

		it("should handle pagination correctly", async () => {
			const mockUsers = Array.from({ length: 25 }, (_, i) => ({
				id: `${i + 1}`,
				name: `User ${i + 1}`,
				email: `user${i + 1}@example.com`,
				cellphone: "1234567890",
				role: "customer" as const,
				createdAt: new Date(),
				updatedAt: new Date(),
			}));

			mockRepository.setUsers(mockUsers);

			const resultPage1 = await userService.getAllUsers(1, 10);
			const resultPage2 = await userService.getAllUsers(2, 10);

			expect(resultPage1.isOk()).toBe(true);
			expect(resultPage2.isOk()).toBe(true);

			if (resultPage1.isOk() && resultPage2.isOk()) {
				expect(resultPage1.value.data).toHaveLength(10);
				expect(resultPage2.value.data).toHaveLength(10);
				expect(resultPage1.value.meta.totalPages).toBe(3);
			}
		});

		it("should return empty array when no users exist", async () => {
			mockRepository.clearUsers();

			const result = await userService.getAllUsers(1, 10);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value.data).toHaveLength(0);
				expect(result.value.meta.total).toBe(0);
			}
		});
	});

	describe("getUserById", () => {
		it("should return user when id exists", async () => {
			const mockUser = {
				id: "123",
				name: "John Doe",
				email: "john@example.com",
				cellphone: "1234567890",
				role: "customer" as const,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockRepository.setUsers([mockUser]);

			const result = await userService.getUserById("123");

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value.id).toBe("123");
				expect(result.value.name).toBe("John Doe");
				expect(result.value.email).toBe("john@example.com");
			}
		});

		it("should return NotFoundError when id does not exist", async () => {
			mockRepository.clearUsers();

			const result = await userService.getUserById("nonexistent");

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error.name).toBe("NotFoundError");
			}
		});
	});

	describe("createUser", () => {
		it("should create user successfully with valid data", async () => {
			const input: CreateUserInput = {
				name: "John Doe",
				email: "john@example.com",
				cellphone: "11987654321",
				role: "customer",
			};

			const result = await userService.createUser(input);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				const user = result.value;
				expect(user.name).toBe("John Doe");
				expect(user.email).toBe("john@example.com");
				expect(user.cellphone).toBe("11987654321");
				expect(user.id).toBeDefined();
			}
		});

		it("should fail when name is empty", async () => {
			const input: CreateUserInput = {
				name: "   ",
				email: "john@example.com",
				cellphone: "11987654321",
				role: "customer",
			};

			const result = await userService.createUser(input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Name cannot be empty");
			}
		});

		it("should fail when cellphone is invalid", async () => {
			const input: CreateUserInput = {
				name: "John Doe",
				email: "john@example.com",
				cellphone: "123", // Too short
				role: "customer",
			};

			const result = await userService.createUser(input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Invalid cellphone number");
			}
		});

		it("should accept cellphone with formatting", async () => {
			const input: CreateUserInput = {
				name: "John Doe",
				email: "john@example.com",
				cellphone: "(11) 98765-4321",
				role: "customer",
			};

			const result = await userService.createUser(input);

			expect(result.isOk()).toBe(true);
		});
	});

	describe("updateUser", () => {
		beforeEach(() => {
			const mockUser = {
				id: "123",
				name: "John Doe",
				email: "john@example.com",
				cellphone: "11987654321",
				role: "customer" as const,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockRepository.setUsers([mockUser]);
		});

		it("should update user successfully", async () => {
			const input: UpdateUserInput = {
				name: "Jane Doe",
				email: "jane@example.com",
			};

			const result = await userService.updateUser("123", input);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value.name).toBe("Jane Doe");
				expect(result.value.email).toBe("jane@example.com");
			}
		});

		it("should fail when updating with empty name", async () => {
			const input: UpdateUserInput = {
				name: "   ",
			};

			const result = await userService.updateUser("123", input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Name cannot be empty");
			}
		});

		it("should fail when updating with invalid cellphone", async () => {
			const input: UpdateUserInput = {
				cellphone: "123",
			};

			const result = await userService.updateUser("123", input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Invalid cellphone number");
			}
		});

		it("should fail when user does not exist", async () => {
			const input: UpdateUserInput = {
				name: "Jane Doe",
			};

			const result = await userService.updateUser("nonexistent", input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error.name).toBe("NotFoundError");
			}
		});

		it("should allow partial updates", async () => {
			const input: UpdateUserInput = {
				name: "Jane Doe",
			};

			const result = await userService.updateUser("123", input);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value.name).toBe("Jane Doe");
				expect(result.value.email).toBe("john@example.com"); // unchanged
			}
		});
	});

	describe("deleteUser", () => {
		beforeEach(() => {
			const mockUser = {
				id: "123",
				name: "John Doe",
				email: "john@example.com",
				cellphone: "11987654321",
				role: "customer" as const,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockRepository.setUsers([mockUser]);
		});

		it("should delete user successfully", async () => {
			const result = await userService.deleteUser("123");

			expect(result.isOk()).toBe(true);

			// Verify user was deleted
			const getResult = await userService.getUserById("123");
			expect(getResult.isErr()).toBe(true);
		});

		it("should fail when user does not exist", async () => {
			const result = await userService.deleteUser("nonexistent");

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error.name).toBe("NotFoundError");
			}
		});
	});
});
