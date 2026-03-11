import { beforeEach, describe, expect, it } from "bun:test";

import { ValidationError } from "@/common/errors";
import { MockStoreRepository } from "@/features/store/store.repository.mock";
import { MockClientRepository } from "./client.repository.mock";
import { ClientService } from "./client.service";
import type { CreateClientInput, UpdateClientInput } from "./client.types";

describe("ClientService", () => {
	let clientService: ClientService;
	let mockRepository: MockClientRepository;
	let mockStoreRepository: MockStoreRepository;

	const validStoreId = "00000000-0000-0000-0000-000000000010";
	const anotherValidStoreId = "00000000-0000-0000-0000-000000000011";
	const invalidStoreId = "00000000-0000-0000-0000-000000000099";

	beforeEach(() => {
		mockRepository = new MockClientRepository();
		mockStoreRepository = new MockStoreRepository();
		mockStoreRepository.setExistingStoreIds([
			validStoreId,
			anotherValidStoreId,
		]);
		clientService = new ClientService(mockRepository, mockStoreRepository);
	});

	describe("getAllClients", () => {
		it("should return paginated clients successfully", async () => {
			const mockClients = [
				{
					id: "1",
					name: "John Doe",
					taxId: null,
					cellphone: "1234567890",
					storeId: validStoreId,
					deletedAt: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: "2",
					name: "Jane Doe",
					taxId: null,
					cellphone: "0987654321",
					storeId: anotherValidStoreId,
					deletedAt: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			mockRepository.setClients(mockClients);

			const result = await clientService.getAllClients(1, 10, validStoreId);

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
			const mockClients = Array.from({ length: 25 }, (_, i) => ({
				id: `${i + 1}`,
				name: `Client ${i + 1}`,
				taxId: null,
				cellphone: "1234567890",
				storeId: validStoreId,
				deletedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			}));

			mockRepository.setClients(mockClients);

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

	describe("getClientById", () => {
		it("should return client when id exists", async () => {
			const mockClient = {
				id: "123",
				name: "John Doe",
				taxId: null,
				cellphone: "1234567890",
				storeId: validStoreId,
				deletedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockRepository.setClients([mockClient]);

			const result = await clientService.getClientById("123");

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value.id).toBe("123");
				expect(result.value.name).toBe("John Doe");
			}
		});

		it("should return NotFoundError when id does not exist", async () => {
			mockRepository.clearClients();

			const result = await clientService.getClientById("nonexistent");

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error.name).toBe("NotFoundError");
			}
		});
	});

	describe("createClient", () => {
		it("should create client successfully with valid data", async () => {
			const input: CreateClientInput = {
				name: "John Doe",
				cellphone: "11987654321",
				storeId: validStoreId,
			};

			const result = await clientService.createClient(input);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				const client = result.value;
				expect(client.name).toBe("John Doe");
				expect(client.cellphone).toBe("11987654321");
				expect(client.id).toBeDefined();
			}
		});

		it("should fail when name is empty", async () => {
			const input: CreateClientInput = {
				name: "   ",
				cellphone: "11987654321",
				storeId: validStoreId,
			};

			const result = await clientService.createClient(input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Name cannot be empty");
			}
		});

		it("should fail when cellphone is invalid", async () => {
			const input: CreateClientInput = {
				name: "John Doe",
				cellphone: "123", // Too short
				storeId: validStoreId,
			};

			const result = await clientService.createClient(input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Invalid cellphone number");
			}
		});

		it("should accept cellphone with formatting", async () => {
			const input: CreateClientInput = {
				name: "John Doe",
				cellphone: "(11) 98765-4321",
				storeId: validStoreId,
			};

			const result = await clientService.createClient(input);

			expect(result.isOk()).toBe(true);
		});

		it("should fail when store does not exist", async () => {
			const input: CreateClientInput = {
				name: "John Doe",
				cellphone: "11987654321",
				storeId: invalidStoreId,
			};

			const result = await clientService.createClient(input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Store not found");
			}
		});
	});

	describe("updateClient", () => {
		beforeEach(() => {
			const mockClient = {
				id: "123",
				name: "John Doe",
				taxId: null,
				cellphone: "11987654321",
				storeId: validStoreId,
				deletedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockRepository.setClients([mockClient]);
		});

		it("should update client successfully", async () => {
			const input: UpdateClientInput = {
				name: "Jane Doe",
			};

			const result = await clientService.updateClient("123", input);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value.name).toBe("Jane Doe");
			}
		});

		it("should fail when updating with empty name", async () => {
			const input: UpdateClientInput = {
				name: "   ",
			};

			const result = await clientService.updateClient("123", input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Name cannot be empty");
			}
		});

		it("should fail when updating with invalid cellphone", async () => {
			const input: UpdateClientInput = {
				cellphone: "123",
			};

			const result = await clientService.updateClient("123", input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Invalid cellphone number");
			}
		});

		it("should fail when client does not exist", async () => {
			const input: UpdateClientInput = {
				name: "Jane Doe",
			};

			const result = await clientService.updateClient("nonexistent", input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error.name).toBe("NotFoundError");
			}
		});

		it("should allow partial updates", async () => {
			const input: UpdateClientInput = {
				name: "Jane Doe",
			};

			const result = await clientService.updateClient("123", input);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value.name).toBe("Jane Doe");
			}
		});
	});

	describe("deleteClient", () => {
		beforeEach(() => {
			const mockClient = {
				id: "123",
				name: "John Doe",
				taxId: null,
				cellphone: "11987654321",
				storeId: validStoreId,
				deletedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockRepository.setClients([mockClient]);
		});

		it("should delete client successfully", async () => {
			const result = await clientService.deleteClient("123");

			expect(result.isOk()).toBe(true);

			// Verify client was deleted
			const getResult = await clientService.getClientById("123");
			expect(getResult.isErr()).toBe(true);
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
