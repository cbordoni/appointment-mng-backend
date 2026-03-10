import { beforeEach, describe, expect, it } from "bun:test";

import { ValidationError } from "@/common/errors";

import { MockStoreRepository } from "./store.repository.mock";
import { StoreService } from "./store.service";
import type { CreateStoreInput, UpdateStoreInput } from "./store.types";

describe("StoreService", () => {
	let storeService: StoreService;
	let mockRepository: MockStoreRepository;

	beforeEach(() => {
		mockRepository = new MockStoreRepository();
		storeService = new StoreService(mockRepository);
	});

	describe("getAllStores", () => {
		it("should return paginated stores successfully", async () => {
			const mockStores = [
				{
					id: "1",
					name: "Store One",
					taxId: null,
					email: "one@store.com",
					cellphone: "11999999999",
					deletedAt: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: "2",
					name: "Store Two",
					taxId: null,
					email: "two@store.com",
					cellphone: "11888888888",
					deletedAt: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			mockRepository.setStores(mockStores);

			const result = await storeService.getAllStores(1, 10);

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
			const mockStores = Array.from({ length: 25 }, (_, i) => ({
				id: `${i + 1}`,
				name: `Store ${i + 1}`,
				taxId: null,
				email: `store${i + 1}@mail.com`,
				cellphone: "11999999999",
				deletedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			}));

			mockRepository.setStores(mockStores);

			const resultPage1 = await storeService.getAllStores(1, 10);
			const resultPage2 = await storeService.getAllStores(2, 10);

			expect(resultPage1.isOk()).toBe(true);
			expect(resultPage2.isOk()).toBe(true);

			if (resultPage1.isOk() && resultPage2.isOk()) {
				expect(resultPage1.value.data).toHaveLength(10);
				expect(resultPage2.value.data).toHaveLength(10);
				expect(resultPage1.value.meta.totalPages).toBe(3);
			}
		});

		it("should return empty array when no stores exist", async () => {
			mockRepository.clearStores();

			const result = await storeService.getAllStores(1, 10);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value.data).toHaveLength(0);
				expect(result.value.meta.total).toBe(0);
			}
		});
	});

	describe("getStoreById", () => {
		it("should return store when id exists", async () => {
			const mockStore = {
				id: "123",
				name: "Store One",
				taxId: "12345678000199",
				email: "one@store.com",
				cellphone: "11999999999",
				deletedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockRepository.setStores([mockStore]);

			const result = await storeService.getStoreById("123");

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value.id).toBe("123");
				expect(result.value.name).toBe("Store One");
			}
		});

		it("should return NotFoundError when id does not exist", async () => {
			mockRepository.clearStores();

			const result = await storeService.getStoreById("nonexistent");

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error.name).toBe("NotFoundError");
			}
		});
	});

	describe("createStore", () => {
		it("should create store successfully with valid data", async () => {
			const input: CreateStoreInput = {
				name: "Store One",
				taxId: "12345678000199",
				email: "one@store.com",
				cellphone: "11999999999",
			};

			const result = await storeService.createStore(input);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				const store = result.value;

				expect(store.id).toBeDefined();
				expect(store.name).toBe("Store One");
				expect(store.taxId).toBe("12345678000199");
				expect(store.cellphone).toBe("11999999999");
			}
		});

		it("should fail when name is empty", async () => {
			const input: CreateStoreInput = {
				name: "   ",
				taxId: "12345678000199",
				email: "one@store.com",
				cellphone: "11999999999",
			};

			const result = await storeService.createStore(input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Name cannot be empty");
			}
		});

		it("should fail when taxId is invalid", async () => {
			const input: CreateStoreInput = {
				name: "Store One",
				taxId: "1234",
				email: "one@store.com",
				cellphone: "11999999999",
			};

			const result = await storeService.createStore(input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Invalid taxId");
			}
		});

		it("should fail when cellphone is invalid", async () => {
			const input: CreateStoreInput = {
				name: "Store One",
				taxId: "12345678000199",
				email: "one@store.com",
				cellphone: "123",
			};

			const result = await storeService.createStore(input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Invalid cellphone number");
			}
		});

		it("should accept creation without taxId and cellphone", async () => {
			const input: CreateStoreInput = {
				name: "Store One",
				email: "one@store.com",
			};

			const result = await storeService.createStore(input);

			expect(result.isOk()).toBe(true);
		});
	});

	describe("updateStore", () => {
		beforeEach(() => {
			const mockStore = {
				id: "123",
				name: "Store One",
				taxId: "12345678000199",
				email: "one@store.com",
				cellphone: "11999999999",
				deletedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockRepository.setStores([mockStore]);
		});

		it("should update store successfully", async () => {
			const input: UpdateStoreInput = {
				name: "Store Updated",
			};

			const result = await storeService.updateStore("123", input);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value.name).toBe("Store Updated");
			}
		});

		it("should fail when updating with empty name", async () => {
			const input: UpdateStoreInput = {
				name: "   ",
			};

			const result = await storeService.updateStore("123", input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Name cannot be empty");
			}
		});

		it("should fail when updating with invalid taxId", async () => {
			const input: UpdateStoreInput = {
				taxId: "1234",
			};

			const result = await storeService.updateStore("123", input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Invalid taxId");
			}
		});

		it("should fail when updating with invalid cellphone", async () => {
			const input: UpdateStoreInput = {
				cellphone: "123",
			};

			const result = await storeService.updateStore("123", input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Invalid cellphone number");
			}
		});

		it("should fail when store does not exist", async () => {
			const input: UpdateStoreInput = {
				name: "Store Updated",
			};

			const result = await storeService.updateStore("nonexistent", input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error.name).toBe("NotFoundError");
			}
		});

		it("should allow partial updates", async () => {
			const input: UpdateStoreInput = {
				email: "new@store.com",
			};

			const result = await storeService.updateStore("123", input);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value.email).toBe("new@store.com");
			}
		});
	});

	describe("deleteStore", () => {
		beforeEach(() => {
			const mockStore = {
				id: "123",
				name: "Store One",
				taxId: "12345678000199",
				email: "one@store.com",
				cellphone: "11999999999",
				deletedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockRepository.setStores([mockStore]);
		});

		it("should delete store successfully", async () => {
			const result = await storeService.deleteStore("123");

			expect(result.isOk()).toBe(true);

			const getResult = await storeService.getStoreById("123");
			expect(getResult.isErr()).toBe(true);
		});

		it("should fail when store does not exist", async () => {
			const result = await storeService.deleteStore("nonexistent");

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error.name).toBe("NotFoundError");
			}
		});
	});
});
