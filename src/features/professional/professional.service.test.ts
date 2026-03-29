import { beforeEach, describe, expect, it } from "bun:test";

import { ValidationError } from "@/common/errors";
import { MockAccountRepository } from "@/features/account/account.repository.mock";

import { MockProfessionalRepository } from "./professional.repository.mock";
import { ProfessionalService } from "./professional.service";
import type {
	CreateProfessionalInput,
	UpdateProfessionalInput,
} from "./professional.types";

describe("ProfessionalService", () => {
	let professionalService: ProfessionalService;
	let mockRepository: MockProfessionalRepository;
	let mockAccountRepository: MockAccountRepository;

	const validStoreId = "00000000-0000-0000-0000-000000000100";
	const anotherValidStoreId = "00000000-0000-0000-0000-000000000200";
	const validAccountId = "00000000-0000-0000-0000-000000000010";
	const anotherValidAccountId = "00000000-0000-0000-0000-000000000011";
	const invalidAccountId = "00000000-0000-0000-0000-000000000099";

	beforeEach(() => {
		mockRepository = new MockProfessionalRepository();
		mockAccountRepository = new MockAccountRepository();
		mockAccountRepository.setAccounts([
			{
				id: validAccountId,
				name: "Account One",
				taxId: null,
				cellphone: "+55 11 90000-0001",
				passwordHash: "hash",
				storeId: validStoreId,
				deletedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				id: anotherValidAccountId,
				name: "Account Two",
				taxId: null,
				cellphone: "+55 11 90000-0002",
				passwordHash: "hash",
				storeId: anotherValidStoreId,
				deletedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		]);
		professionalService = new ProfessionalService(
			mockRepository,
			mockAccountRepository,
		);
	});

	describe("getAllProfessionals", () => {
		it("should return paginated professionals successfully", async () => {
			const mockProfessionals = [
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

			mockRepository.setProfessionals(mockProfessionals);

			const result = await professionalService.getAllProfessionals(
				1,
				10,
				validStoreId,
			);

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
				accountId: validAccountId,
				deletedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockRepository.setProfessionals([mockProfessional]);

			const result = await professionalService.getProfessionalById("123");

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value.id).toBe("123");
				expect(result.value.accountId).toBe(validAccountId);
			}
		});
	});

	describe("createProfessional", () => {
		it("should create professional successfully with valid data", async () => {
			const input: CreateProfessionalInput = {
				accountId: validAccountId,
			};

			const result = await professionalService.createProfessional(input);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				const professional = result.value;
				expect(professional.accountId).toBe(validAccountId);
				expect(professional.id).toBeDefined();
			}
		});

		it("should fail when account does not exist", async () => {
			const input: CreateProfessionalInput = {
				accountId: invalidAccountId,
			};

			const result = await professionalService.createProfessional(input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Account not found");
			}
		});
	});

	describe("updateProfessional", () => {
		beforeEach(() => {
			const mockProfessional = {
				id: "123",
				accountId: validAccountId,
				deletedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockRepository.setProfessionals([mockProfessional]);
		});

		it("should update professional successfully", async () => {
			const input: UpdateProfessionalInput = {
				accountId: anotherValidAccountId,
			};

			const result = await professionalService.updateProfessional("123", input);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value.accountId).toBe(anotherValidAccountId);
			}
		});

		it("should fail when updating with invalid account", async () => {
			const input: UpdateProfessionalInput = {
				accountId: invalidAccountId,
			};

			const result = await professionalService.updateProfessional("123", input);

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Account not found");
			}
		});
	});
});
