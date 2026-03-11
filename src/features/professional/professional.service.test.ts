import { beforeEach, describe, expect, it } from "bun:test";

import { ValidationError } from "@/common/errors";
import { MockStoreRepository } from "@/features/store/store.repository.mock";

import { MockProfessionalRepository } from "./professional.repository.mock";
import { ProfessionalService } from "./professional.service";
import type {
	CreateProfessionalInput,
	UpdateProfessionalInput,
} from "./professional.types";

describe("ProfessionalService", () => {
	let professionalService: ProfessionalService;
	let mockRepository: MockProfessionalRepository;
	let mockStoreRepository: MockStoreRepository;

	const validStoreId = "00000000-0000-0000-0000-000000000010";
	const anotherValidStoreId = "00000000-0000-0000-0000-000000000011";
	const invalidStoreId = "00000000-0000-0000-0000-000000000099";

	beforeEach(() => {
		mockRepository = new MockProfessionalRepository();
		mockStoreRepository = new MockStoreRepository();
		mockStoreRepository.setExistingStoreIds([
			validStoreId,
			anotherValidStoreId,
		]);
		professionalService = new ProfessionalService(
			mockRepository,
			mockStoreRepository,
		);
	});

	describe("getAllProfessionals", () => {
		it("should return paginated professionals successfully", async () => {
			const mockProfessionals = [
				{
					id: "1",
					name: "Dr. John Doe",
					taxId: "12345678901",
					cellphone: "11999999999",
					storeId: validStoreId,
					deletedAt: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: "2",
					name: "Dr. Jane Doe",
					taxId: "10987654321",
					cellphone: "11888888888",
					storeId: anotherValidStoreId,
					deletedAt: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			mockRepository.setProfessionals(mockProfessionals);

			const result = await professionalService.getAllProfessionals(
				1,
				10,
				validStoreId,
			);

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
	});

	describe("getProfessionalById", () => {
		it("should return professional when id exists", async () => {
			const mockProfessional = {
				id: "123",
				name: "Dr. John Doe",
				taxId: "12345678901",
				cellphone: "11999999999",
				storeId: validStoreId,
				deletedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockRepository.setProfessionals([mockProfessional]);

			const result = await professionalService.getProfessionalById("123");

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value.id).toBe("123");
				expect(result.value.name).toBe("Dr. John Doe");
			}
		});
	});

	describe("createProfessional", () => {
		it("should create professional successfully with valid data", async () => {
			const input: CreateProfessionalInput = {
				name: "Dr. John Doe",
				taxId: "12345678901",
				cellphone: "11999999999",
				storeId: validStoreId,
			};

			const result = await professionalService.createProfessional(input);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				const professional = result.value;
				expect(professional.name).toBe("Dr. John Doe");
				expect(professional.taxId).toBe("12345678901");
				expect(professional.cellphone).toBe("11999999999");
				expect(professional.id).toBeDefined();
			}
		});

		it("should fail when name is empty", async () => {
			const input: CreateProfessionalInput = {
				name: "   ",
				taxId: "12345678901",
				cellphone: "11999999999",
				storeId: validStoreId,
			};

			const result = await professionalService.createProfessional(input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Name cannot be empty");
			}
		});

		it("should fail when tax id is invalid", async () => {
			const input: CreateProfessionalInput = {
				name: "Dr. John Doe",
				taxId: "1234",
				cellphone: "11999999999",
				storeId: validStoreId,
			};

			const result = await professionalService.createProfessional(input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Invalid tax id");
			}
		});

		it("should fail when store does not exist", async () => {
			const input: CreateProfessionalInput = {
				name: "Dr. John Doe",
				taxId: "12345678901",
				cellphone: "11999999999",
				storeId: invalidStoreId,
			};

			const result = await professionalService.createProfessional(input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Store not found");
			}
		});
	});

	describe("updateProfessional", () => {
		beforeEach(() => {
			const mockProfessional = {
				id: "123",
				name: "Dr. John Doe",
				taxId: "12345678901",
				cellphone: "11999999999",
				storeId: validStoreId,
				deletedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockRepository.setProfessionals([mockProfessional]);
		});

		it("should update professional successfully", async () => {
			const input: UpdateProfessionalInput = {
				name: "Dr. Jane Doe",
			};

			const result = await professionalService.updateProfessional("123", input);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value.name).toBe("Dr. Jane Doe");
			}
		});

		it("should fail when updating with invalid cellphone", async () => {
			const input: UpdateProfessionalInput = {
				cellphone: "123",
			};

			const result = await professionalService.updateProfessional("123", input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Invalid cellphone number");
			}
		});
	});
});
