import { beforeEach, describe, expect, it } from "bun:test";

import { ValidationError } from "@/common/errors";
import { MockAccountRepository } from "@/features/account/account.repository.mock";
import { MockClientRepository } from "./client.repository.mock";
import { ClientService } from "./client.service";
import type { CreateClientInput } from "./client.types";

describe("ClientService", () => {
	let clientService: ClientService;
	let mockRepository: MockClientRepository;
	let mockAccountRepository: MockAccountRepository;

	const validAccountId = "00000000-0000-0000-0000-000000000010";
	const anotherValidAccountId = "00000000-0000-0000-0000-000000000011";
	const invalidAccountId = "00000000-0000-0000-0000-000000000099";
	const validStoreId = "store-1";
	const anotherStoreId = "store-2";

	beforeEach(() => {
		mockRepository = new MockClientRepository();
		mockAccountRepository = new MockAccountRepository();
		mockAccountRepository.setExistingAccountIds([
			validAccountId,
			anotherValidAccountId,
		]);
		clientService = new ClientService(mockRepository, mockAccountRepository);
	});

	describe("getAllClients", () => {
		it("should return paginated clients successfully", async () => {
			const mockClients = [
				{
					id: "1",
					accountId: validAccountId,
					deletedAt: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: "2",
					accountId: anotherValidAccountId,
					deletedAt: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			const mockAccounts = [
				{
					id: validAccountId,
					name: "Account 1",
					taxId: null,
					cellphone: "+55 11 98765-4321",
					passwordHash: "hashed",
					storeId: validStoreId,
					deletedAt: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: anotherValidAccountId,
					name: "Account 2",
					taxId: null,
					cellphone: "+55 11 98765-4322",
					passwordHash: "hashed",
					storeId: anotherStoreId,
					deletedAt: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			mockRepository.setClients(mockClients);
			mockRepository.setAccounts(mockAccounts);
			const result = await clientService.getAllClients(1, 10, validStoreId);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				const response = result.value;
				expect(response.data).toHaveLength(1);
				expect(response.data[0]).toEqual({
					id: validAccountId,
					name: "Account 1",
					cellphone: "+55 11 98765-4321",
				});
				expect(response.meta.page).toBe(1);
				expect(response.meta.limit).toBe(10);
				expect(response.meta.total).toBe(1);
				expect(response.meta.totalPages).toBe(1);
			}
		});

		it("should handle pagination correctly", async () => {
			const mockClients = Array.from({ length: 25 }, (_, i) => ({
				id: `${i + 1}`,
				accountId: validAccountId,
				deletedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			}));

			const mockAccount = {
				id: validAccountId,
				name: "Test Account",
				taxId: null,
				cellphone: "+55 11 98765-4321",
				passwordHash: "hashed",
				storeId: validStoreId,
				deletedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockRepository.setClients(mockClients);
			mockRepository.setAccounts([mockAccount]);
			const resultPage1 = await clientService.getAllClients(
				1,
				10,
				validStoreId,
			);
			const resultPage2 = await clientService.getAllClients(
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

		it("should return empty array when no clients exist", async () => {
			mockRepository.clearClients();

			const result = await clientService.getAllClients(1, 10, validStoreId);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value.data).toHaveLength(0);
				expect(result.value.meta.total).toBe(0);
			}
		});
	});

	describe("createClient", () => {
		it("should create client successfully with valid account", async () => {
			const input: CreateClientInput = {
				accountId: validAccountId,
			};

			const result = await clientService.createClient(input);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				const client = result.value;
				expect(client.accountId).toBe(validAccountId);
				expect(client.id).toBeDefined();
				expect(client.createdAt).toBeDefined();
				expect(client.updatedAt).toBeDefined();
			}
		});

		it("should fail when account does not exist", async () => {
			const input: CreateClientInput = {
				accountId: invalidAccountId,
			};

			const result = await clientService.createClient(input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Account not found");
			}
		});

		it("should create multiple clients for different accounts", async () => {
			const input1: CreateClientInput = {
				accountId: validAccountId,
			};

			const input2: CreateClientInput = {
				accountId: anotherValidAccountId,
			};

			const result1 = await clientService.createClient(input1);
			const result2 = await clientService.createClient(input2);

			expect(result1.isOk()).toBe(true);
			expect(result2.isOk()).toBe(true);

			if (result1.isOk() && result2.isOk()) {
				expect(result1.value.accountId).toBe(validAccountId);
				expect(result2.value.accountId).toBe(anotherValidAccountId);
				expect(result1.value.id).not.toBe(result2.value.id);
			}
		});
	});

	describe("deleteClient", () => {
		beforeEach(() => {
			const mockClient = {
				id: "123",
				accountId: validAccountId,
				deletedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockRepository.setClients([mockClient]);
		});

		it("should delete client successfully", async () => {
			const result = await clientService.deleteClient("123");

			expect(result.isOk()).toBe(true);
		});

		it("should fail when client does not exist", async () => {
			const result = await clientService.deleteClient("nonexistent");

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error.name).toBe("NotFoundError");
			}
		});
	});
});
