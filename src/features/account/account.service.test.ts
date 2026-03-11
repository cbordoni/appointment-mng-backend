import { beforeEach, describe, expect, it } from "bun:test";

import { NotFoundError, ValidationError } from "@/common/errors";
import { MockStoreRepository } from "@/features/store/store.repository.mock";

import { MockAccountRepository } from "./account.repository.mock";
import { AccountService } from "./account.service";
import type { CreateAccountInput, UpdateAccountInput } from "./account.types";

describe("AccountService", () => {
	let accountService: AccountService;
	let mockRepository: MockAccountRepository;
	let mockStoreRepository: MockStoreRepository;

	const validStoreId = "00000000-0000-0000-0000-000000000010";
	const anotherValidStoreId = "00000000-0000-0000-0000-000000000011";
	const invalidStoreId = "00000000-0000-0000-0000-000000000099";

	beforeEach(() => {
		mockRepository = new MockAccountRepository();
		mockStoreRepository = new MockStoreRepository();
		mockStoreRepository.setExistingStoreIds([
			validStoreId,
			anotherValidStoreId,
		]);
		accountService = new AccountService(mockRepository, mockStoreRepository);
	});

	describe("getAllAccounts", () => {
		it("should return paginated accounts filtered by storeId", async () => {
			const mockAccounts = [
				{
					id: "1",
					name: "Account One",
					taxId: null,
					cellphone: "11999999999",
					passwordHash: "hash_one",
					storeId: validStoreId,
					deletedAt: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: "2",
					name: "Account Two",
					taxId: null,
					cellphone: "11888888888",
					passwordHash: "hash_two",
					storeId: anotherValidStoreId,
					deletedAt: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			mockRepository.setAccounts(mockAccounts);

			const result = await accountService.getAllAccounts(1, 10, validStoreId);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				const response = result.value;

				expect(response.data).toHaveLength(1);
				expect(response.data[0]?.storeId).toBe(validStoreId);
				expect(response.meta.page).toBe(1);
				expect(response.meta.limit).toBe(10);
				expect(response.meta.total).toBe(1);
				expect(response.meta.totalPages).toBe(1);
			}
		});

		it("should handle pagination correctly", async () => {
			const mockAccounts = Array.from({ length: 25 }, (_, i) => ({
				id: `${i + 1}`,
				name: `Account ${i + 1}`,
				taxId: null,
				cellphone: "11999999999",
				passwordHash: "hash",
				storeId: validStoreId,
				deletedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			}));

			mockRepository.setAccounts(mockAccounts);

			const resultPage1 = await accountService.getAllAccounts(
				1,
				10,
				validStoreId,
			);
			const resultPage2 = await accountService.getAllAccounts(
				2,
				10,
				validStoreId,
			);

			expect(resultPage1.isOk()).toBe(true);
			expect(resultPage2.isOk()).toBe(true);

			if (resultPage1.isOk() && resultPage2.isOk()) {
				expect(resultPage1.value.data).toHaveLength(10);
				expect(resultPage2.value.data).toHaveLength(10);
				expect(resultPage1.value.meta.totalPages).toBe(3);
			}
		});

		it("should return empty array when no accounts exist", async () => {
			mockRepository.clearAccounts();

			const result = await accountService.getAllAccounts(1, 10, validStoreId);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value.data).toHaveLength(0);
				expect(result.value.meta.total).toBe(0);
			}
		});

		it("should exclude soft-deleted accounts", async () => {
			const mockAccounts = [
				{
					id: "1",
					name: "Active Account",
					taxId: null,
					cellphone: "11999999999",
					passwordHash: "hash",
					storeId: validStoreId,
					deletedAt: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: "2",
					name: "Deleted Account",
					taxId: null,
					cellphone: "11888888888",
					passwordHash: "hash",
					storeId: validStoreId,
					deletedAt: new Date(),
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			mockRepository.setAccounts(mockAccounts);

			const result = await accountService.getAllAccounts(1, 10, validStoreId);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value.data).toHaveLength(1);
				expect(result.value.data[0]?.name).toBe("Active Account");
			}
		});
	});

	describe("getAccountById", () => {
		it("should return account when id exists", async () => {
			const mockAccount = {
				id: "123",
				name: "Account One",
				taxId: null,
				cellphone: "11999999999",
				passwordHash: "hash",
				storeId: validStoreId,
				deletedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockRepository.setAccounts([mockAccount]);

			const result = await accountService.getAccountById("123");

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value.id).toBe("123");
				expect(result.value.name).toBe("Account One");
			}
		});

		it("should return NotFoundError when id does not exist", async () => {
			mockRepository.clearAccounts();

			const result = await accountService.getAccountById("nonexistent");

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error.name).toBe("NotFoundError");
			}
		});

		it("should not return soft-deleted account", async () => {
			const mockAccount = {
				id: "123",
				name: "Deleted Account",
				taxId: null,
				cellphone: "11999999999",
				passwordHash: "hash",
				storeId: validStoreId,
				deletedAt: new Date(),
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockRepository.setAccounts([mockAccount]);

			const result = await accountService.getAccountById("123");

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(NotFoundError);
			}
		});
	});

	describe("createAccount", () => {
		it("should create account successfully with valid data", async () => {
			const input: CreateAccountInput = {
				name: "Account One",
				cellphone: "11987654321",
				password: "securepassword",
				storeId: validStoreId,
			};

			const result = await accountService.createAccount(input);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				const account = result.value;

				expect(account.name).toBe("Account One");
				expect(account.cellphone).toBe("11987654321");
				expect(account.id).toBeDefined();
				expect(account.passwordHash).toBeDefined();
			}
		});

		it("should not store plain password", async () => {
			const input: CreateAccountInput = {
				name: "Account One",
				cellphone: "11987654321",
				password: "securepassword",
				storeId: validStoreId,
			};

			const result = await accountService.createAccount(input);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				const account = result.value as Record<string, unknown>;

				expect(account.password).toBeUndefined();
				expect(account.passwordHash).not.toBe("securepassword");
			}
		});

		it("should create account with optional taxId", async () => {
			const input: CreateAccountInput = {
				name: "Account One",
				taxId: "12345678901",
				cellphone: "11987654321",
				password: "securepassword",
				storeId: validStoreId,
			};

			const result = await accountService.createAccount(input);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value.taxId).toBe("12345678901");
			}
		});

		it("should fail when name is empty", async () => {
			const input: CreateAccountInput = {
				name: "   ",
				cellphone: "11987654321",
				password: "securepassword",
				storeId: validStoreId,
			};

			const result = await accountService.createAccount(input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Name cannot be empty");
			}
		});

		it("should fail when cellphone is too short", async () => {
			const input: CreateAccountInput = {
				name: "Account One",
				cellphone: "123",
				password: "securepassword",
				storeId: validStoreId,
			};

			const result = await accountService.createAccount(input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Invalid cellphone number");
			}
		});

		it("should accept cellphone with formatting characters", async () => {
			const input: CreateAccountInput = {
				name: "Account One",
				cellphone: "(11) 98765-4321",
				password: "securepassword",
				storeId: validStoreId,
			};

			const result = await accountService.createAccount(input);

			expect(result.isOk()).toBe(true);
		});

		it("should fail when store does not exist", async () => {
			const input: CreateAccountInput = {
				name: "Account One",
				cellphone: "11987654321",
				password: "securepassword",
				storeId: invalidStoreId,
			};

			const result = await accountService.createAccount(input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Store not found");
			}
		});
	});

	describe("updateAccount", () => {
		beforeEach(() => {
			const mockAccount = {
				id: "123",
				name: "Account One",
				taxId: null,
				cellphone: "11987654321",
				passwordHash: "old_hash",
				storeId: validStoreId,
				deletedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockRepository.setAccounts([mockAccount]);
		});

		it("should update account name successfully", async () => {
			const input: UpdateAccountInput = {
				name: "Updated Account",
			};

			const result = await accountService.updateAccount("123", input);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value.name).toBe("Updated Account");
			}
		});

		it("should update password and store as hash", async () => {
			const input: UpdateAccountInput = {
				password: "newpassword123",
			};

			const result = await accountService.updateAccount("123", input);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value.passwordHash).toBeDefined();
				expect(result.value.passwordHash).not.toBe("old_hash");
				expect(result.value.passwordHash).not.toBe("newpassword123");
			}
		});

		it("should allow partial update with only taxId", async () => {
			const input: UpdateAccountInput = {
				taxId: "12345678901",
			};

			const result = await accountService.updateAccount("123", input);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value.taxId).toBe("12345678901");
			}
		});

		it("should fail when updating with empty name", async () => {
			const input: UpdateAccountInput = {
				name: "   ",
			};

			const result = await accountService.updateAccount("123", input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Name cannot be empty");
			}
		});

		it("should fail when updating with invalid cellphone", async () => {
			const input: UpdateAccountInput = {
				cellphone: "123",
			};

			const result = await accountService.updateAccount("123", input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Invalid cellphone number");
			}
		});

		it("should fail when account does not exist", async () => {
			const input: UpdateAccountInput = {
				name: "Updated Account",
			};

			const result = await accountService.updateAccount("nonexistent", input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(NotFoundError);
			}
		});
	});

	describe("deleteAccount", () => {
		beforeEach(() => {
			const mockAccount = {
				id: "123",
				name: "Account One",
				taxId: null,
				cellphone: "11987654321",
				passwordHash: "hash",
				storeId: validStoreId,
				deletedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockRepository.setAccounts([mockAccount]);
		});

		it("should soft-delete account successfully", async () => {
			const result = await accountService.deleteAccount("123");

			expect(result.isOk()).toBe(true);

			const getResult = await accountService.getAccountById("123");

			expect(getResult.isErr()).toBe(true);

			if (getResult.isErr()) {
				expect(getResult.error).toBeInstanceOf(NotFoundError);
			}
		});

		it("should fail when account does not exist", async () => {
			const result = await accountService.deleteAccount("nonexistent");

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(NotFoundError);
			}
		});

		it("should not affect other accounts when deleting one", async () => {
			const anotherAccount = {
				id: "456",
				name: "Another Account",
				taxId: null,
				cellphone: "11888888888",
				passwordHash: "hash",
				storeId: validStoreId,
				deletedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockRepository.setAccounts([
				{
					id: "123",
					name: "Account One",
					taxId: null,
					cellphone: "11987654321",
					passwordHash: "hash",
					storeId: validStoreId,
					deletedAt: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				anotherAccount,
			]);

			await accountService.deleteAccount("123");

			const getResult = await accountService.getAccountById("456");

			expect(getResult.isOk()).toBe(true);
		});
	});
});
