import { beforeEach, describe, expect, it } from "bun:test";

import { ValidationError } from "@/common/errors";

import { MockProfessionalRepository } from "./professional.repository.mock";
import { ProfessionalService } from "./professional.service";
import type {
	CreateProfessionalInput,
	UpdateProfessionalInput,
} from "./professional.types";

describe("ProfessionalService", () => {
	let professionalService: ProfessionalService;
	let mockRepository: MockProfessionalRepository;

	beforeEach(() => {
		mockRepository = new MockProfessionalRepository();
		professionalService = new ProfessionalService(mockRepository);
	});

	describe("getAllProfessionals", () => {
		it("should return paginated professionals successfully", async () => {
			const mockProfessionals = [
				{
					id: "1",
					name: "Dr. John Doe",
					taxId: "12345678901",
					cellphone: "11999999999",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: "2",
					name: "Dr. Jane Doe",
					taxId: "10987654321",
					cellphone: "11888888888",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			mockRepository.setProfessionals(mockProfessionals);

			const result = await professionalService.getAllProfessionals(1, 10);

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
	});

	describe("getProfessionalById", () => {
		it("should return professional when id exists", async () => {
			const mockProfessional = {
				id: "123",
				name: "Dr. John Doe",
				taxId: "12345678901",
				cellphone: "11999999999",
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
			};

			const result = await professionalService.createProfessional(input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Invalid tax id");
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
