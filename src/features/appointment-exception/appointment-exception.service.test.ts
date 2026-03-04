import { beforeEach, describe, expect, it } from "bun:test";
import { err, ok } from "neverthrow";

import { NotFoundError, ValidationError } from "@/common/errors";
import type { AppointmentExdate } from "@/db/schema";

import type { IAppointmentExceptionRepository } from "./appointment-exception.repository.interface";
import { AppointmentExceptionService } from "./appointment-exception.service";
import type {
	CreateAppointmentExceptionInput,
	UpdateAppointmentExceptionInput,
} from "./appointment-exception.types";

class MockAppointmentExceptionRepository
	implements IAppointmentExceptionRepository
{
	private items: AppointmentExdate[] = [];

	async findAll(page: number, limit: number) {
		const offset = (page - 1) * limit;
		const data = this.items.slice(offset, offset + limit);

		return ok({ items: data, total: this.items.length });
	}

	async findById(id: string) {
		const item = this.items.find((current) => current.id === id);

		if (!item) {
			return err(new NotFoundError("AppointmentException", id));
		}

		return ok(item);
	}

	async findByAppointmentIds(appointmentIds: string[]) {
		return ok(
			this.items.filter((item) => appointmentIds.includes(item.appointmentId)),
		);
	}

	async create(data: CreateAppointmentExceptionInput) {
		const item: AppointmentExdate = {
			id: crypto.randomUUID(),
			appointmentId: data.appointmentId,
			exdate: new Date(data.exdate),
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		this.items.push(item);

		return ok(item);
	}

	async update(id: string, data: UpdateAppointmentExceptionInput) {
		const index = this.items.findIndex((item) => item.id === id);

		if (index === -1) {
			return err(new NotFoundError("AppointmentException", id));
		}

		const current = this.items[index];
		const updated: AppointmentExdate = {
			...current,
			...(data.appointmentId !== undefined && {
				appointmentId: data.appointmentId,
			}),
			...(data.exdate !== undefined && { exdate: new Date(data.exdate) }),
			updatedAt: new Date(),
		};

		this.items[index] = updated;

		return ok(updated);
	}

	async replaceByAppointmentId(appointmentId: string, exdates: Date[]) {
		this.items = this.items.filter(
			(item) => item.appointmentId !== appointmentId,
		);

		const created = exdates.map((exdate) => ({
			id: crypto.randomUUID(),
			appointmentId,
			exdate,
			createdAt: new Date(),
			updatedAt: new Date(),
		}));

		this.items.push(...created);

		return ok(undefined);
	}

	async delete(id: string) {
		const index = this.items.findIndex((item) => item.id === id);

		if (index === -1) {
			return err(new NotFoundError("AppointmentException", id));
		}

		this.items.splice(index, 1);

		return ok(undefined);
	}

	setItems(items: AppointmentExdate[]) {
		this.items = items;
	}
}

describe("AppointmentExceptionService", () => {
	let repository: MockAppointmentExceptionRepository;
	let service: AppointmentExceptionService;

	beforeEach(() => {
		repository = new MockAppointmentExceptionRepository();
		service = new AppointmentExceptionService(repository);
	});

	describe("getAll", () => {
		it("should return paginated exceptions", async () => {
			repository.setItems([
				{
					id: "1",
					appointmentId: "a-1",
					exdate: new Date("2026-03-01T10:00:00.000Z"),
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: "2",
					appointmentId: "a-1",
					exdate: new Date("2026-03-08T10:00:00.000Z"),
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			]);

			const result = await service.getAll(1, 10);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value.data).toHaveLength(2);
				expect(result.value.meta.total).toBe(2);
			}
		});
	});

	describe("create", () => {
		it("should create exception with valid exdate", async () => {
			const input: CreateAppointmentExceptionInput = {
				appointmentId: "00000000-0000-0000-0000-000000000001",
				exdate: "2026-03-15T10:00:00.000Z",
			};

			const result = await service.create(input);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value.appointmentId).toBe(input.appointmentId);
			}
		});

		it("should fail when exdate is invalid", async () => {
			const result = await service.create({
				appointmentId: "00000000-0000-0000-0000-000000000001",
				exdate: "invalid-date",
			});

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Invalid exdate");
			}
		});
	});

	describe("update", () => {
		it("should fail when exdate is invalid", async () => {
			const result = await service.update("1", {
				exdate: "invalid-date",
			});

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Invalid exdate");
			}
		});
	});

	describe("delete", () => {
		it("should delete exception successfully", async () => {
			repository.setItems([
				{
					id: "1",
					appointmentId: "a-1",
					exdate: new Date("2026-03-01T10:00:00.000Z"),
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			]);

			const result = await service.delete("1");

			expect(result.isOk()).toBe(true);
		});

		it("should fail when exception does not exist", async () => {
			const result = await service.delete("missing-id");

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(NotFoundError);
			}
		});
	});
});
