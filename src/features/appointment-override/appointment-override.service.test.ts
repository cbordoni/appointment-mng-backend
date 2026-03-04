import { beforeEach, describe, expect, it } from "bun:test";
import { err, ok } from "neverthrow";

import { NotFoundError, ValidationError } from "@/common/errors";
import type { AppointmentOverride } from "@/db/schema";

import type { IAppointmentOverrideRepository } from "./appointment-override.repository.interface";
import { AppointmentOverrideService } from "./appointment-override.service";
import type {
	AppointmentOverrideReplaceInput,
	CreateAppointmentOverrideInput,
	UpdateAppointmentOverrideInput,
} from "./appointment-override.types";

class MockAppointmentOverrideRepository
	implements IAppointmentOverrideRepository
{
	private items: AppointmentOverride[] = [];

	async findAll(page: number, limit: number) {
		const offset = (page - 1) * limit;
		const data = this.items.slice(offset, offset + limit);

		return ok({ items: data, total: this.items.length });
	}

	async findById(id: string) {
		const item = this.items.find((current) => current.id === id);

		if (!item) {
			return err(new NotFoundError("AppointmentOverride", id));
		}

		return ok(item);
	}

	async findByAppointmentIds(appointmentIds: string[]) {
		return ok(
			this.items.filter((item) => appointmentIds.includes(item.appointmentId)),
		);
	}

	async create(data: CreateAppointmentOverrideInput) {
		const item: AppointmentOverride = {
			id: crypto.randomUUID(),
			appointmentId: data.appointmentId,
			recurrenceId: new Date(data.recurrenceId),
			summary: data.summary ?? null,
			description: data.description ?? null,
			dtstart: data.dtstart ? new Date(data.dtstart) : null,
			dtend: data.dtend ? new Date(data.dtend) : null,
			status: data.status ?? null,
			professionalId: data.professionalId ?? null,
			sequence: data.sequence ?? 0,
			dtstamp: data.dtstamp ? new Date(data.dtstamp) : new Date(),
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		this.items.push(item);

		return ok(item);
	}

	async update(id: string, data: UpdateAppointmentOverrideInput) {
		const index = this.items.findIndex((item) => item.id === id);

		if (index === -1) {
			return err(new NotFoundError("AppointmentOverride", id));
		}

		const current = this.items[index];
		const updated: AppointmentOverride = {
			...current,
			...(data.appointmentId !== undefined && {
				appointmentId: data.appointmentId,
			}),
			...(data.recurrenceId !== undefined && {
				recurrenceId: new Date(data.recurrenceId),
			}),
			...(data.summary !== undefined && { summary: data.summary }),
			...(data.description !== undefined && {
				description: data.description,
			}),
			...(data.dtstart !== undefined && {
				dtstart: data.dtstart ? new Date(data.dtstart) : null,
			}),
			...(data.dtend !== undefined && {
				dtend: data.dtend ? new Date(data.dtend) : null,
			}),
			...(data.status !== undefined && { status: data.status }),
			...(data.professionalId !== undefined && {
				professionalId: data.professionalId,
			}),
			...(data.sequence !== undefined && { sequence: data.sequence }),
			...(data.dtstamp !== undefined && { dtstamp: new Date(data.dtstamp) }),
			updatedAt: new Date(),
		};

		this.items[index] = updated;

		return ok(updated);
	}

	async replaceByAppointmentId(
		appointmentId: string,
		overrides: AppointmentOverrideReplaceInput[],
	) {
		this.items = this.items.filter(
			(item) => item.appointmentId !== appointmentId,
		);

		const created = overrides.map((override) => ({
			id: crypto.randomUUID(),
			appointmentId,
			recurrenceId: override.recurrenceId,
			summary: override.summary,
			description: override.description,
			dtstart: override.dtstart,
			dtend: override.dtend,
			status: override.status,
			professionalId: override.professionalId,
			sequence: override.sequence,
			dtstamp: override.dtstamp,
			createdAt: new Date(),
			updatedAt: new Date(),
		}));

		this.items.push(...created);

		return ok(undefined);
	}

	async delete(id: string) {
		const index = this.items.findIndex((item) => item.id === id);

		if (index === -1) {
			return err(new NotFoundError("AppointmentOverride", id));
		}

		this.items.splice(index, 1);

		return ok(undefined);
	}

	setItems(items: AppointmentOverride[]) {
		this.items = items;
	}
}

describe("AppointmentOverrideService", () => {
	let repository: MockAppointmentOverrideRepository;
	let service: AppointmentOverrideService;

	beforeEach(() => {
		repository = new MockAppointmentOverrideRepository();
		service = new AppointmentOverrideService(repository);
	});

	describe("getAll", () => {
		it("should return paginated overrides", async () => {
			repository.setItems([
				{
					id: "1",
					appointmentId: "a-1",
					recurrenceId: new Date("2026-03-01T10:00:00.000Z"),
					summary: null,
					description: null,
					dtstart: null,
					dtend: null,
					status: null,
					professionalId: null,
					sequence: 0,
					dtstamp: new Date(),
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			]);

			const result = await service.getAll(1, 10);

			expect(result.isOk()).toBe(true);

			if (result.isOk()) {
				expect(result.value.data).toHaveLength(1);
				expect(result.value.meta.total).toBe(1);
			}
		});
	});

	describe("create", () => {
		it("should create override with valid input", async () => {
			const input: CreateAppointmentOverrideInput = {
				appointmentId: "00000000-0000-0000-0000-000000000001",
				recurrenceId: "2026-03-15T10:00:00.000Z",
				dtstart: "2026-03-15T11:00:00.000Z",
				dtend: "2026-03-15T12:00:00.000Z",
			};

			const result = await service.create(input);

			expect(result.isOk()).toBe(true);
		});

		it("should fail when recurrenceId is invalid", async () => {
			const result = await service.create({
				appointmentId: "00000000-0000-0000-0000-000000000001",
				recurrenceId: "invalid-date",
			});

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Invalid recurrenceId");
			}
		});

		it("should fail when dtstart is invalid", async () => {
			const result = await service.create({
				appointmentId: "00000000-0000-0000-0000-000000000001",
				recurrenceId: "2026-03-15T10:00:00.000Z",
				dtstart: "invalid-date",
			});

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Invalid dtstart");
			}
		});
	});

	describe("update", () => {
		it("should fail when dtend is invalid", async () => {
			const result = await service.update("1", {
				dtend: "invalid-date",
			});

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(ValidationError);
				expect(result.error.message).toBe("Invalid dtend");
			}
		});
	});

	describe("delete", () => {
		it("should fail when override does not exist", async () => {
			const result = await service.delete("missing-id");

			expect(result.isErr()).toBe(true);

			if (result.isErr()) {
				expect(result.error).toBeInstanceOf(NotFoundError);
			}
		});
	});
});
