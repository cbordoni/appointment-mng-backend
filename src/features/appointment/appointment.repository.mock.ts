import { err, ok, type Result } from "neverthrow";

import { NotFoundError } from "@/common/errors";
import type { PaginatedResult } from "@/common/types";
import type { AsyncDomainResult } from "@/common/types/database-result";
import type { Appointment } from "@/db/schema";
import { BaseInMemoryRepository } from "@/testing/base-in-memory-repository";

import type { IAppointmentRepository } from "./appointment.repository.interface";
import type {
	AppointmentWithClient,
	CreateAppointmentInput,
	UpdateAppointmentInput,
} from "./appointment.types";

export class MockAppointmentRepository
	extends BaseInMemoryRepository<Appointment>
	implements IAppointmentRepository
{
	async findByProfessionalId(
		professionalId: string,
		page: number,
		limit: number,
	): AsyncDomainResult<PaginatedResult<Appointment>> {
		const filtered = this.items.filter((a) => {
			return a.professionalId === professionalId && !a.deletedAt;
		});

		const offset = (page - 1) * limit;
		const items = filtered.slice(offset, offset + limit);

		return ok({ items, total: filtered.length });
	}
	private clientsMap = new Map<string, string>();
	private professionalsMap = new Map<string, string>();

	protected get entityName(): string {
		return "Appointment";
	}

	setClientsMap(map: Map<string, string>) {
		this.clientsMap = map;
	}

	setProfessionalsMap(map: Map<string, string>) {
		this.professionalsMap = map;
	}

	async findAll(page: number, limit: number) {
		const filtered = this.items.filter((appointment) => !appointment.deletedAt);
		const offset = (page - 1) * limit;
		const items = filtered.slice(offset, offset + limit);

		return ok({ items, total: filtered.length });
	}

	async findByDateRange(
		from?: Date,
		to?: Date,
	): Promise<Result<AppointmentWithClient[], never>> {
		const filtered = this.items.filter((a) => {
			if (a.deletedAt) return false;

			if (from && a.dtstart < from) return false;

			if (to && a.dtstart > to) return false;

			return true;
		});

		const result = filtered.map((appointment) => ({
			...appointment,
			clientName: this.clientsMap.get(appointment.clientId) ?? "Unknown",
			professionalName:
				this.professionalsMap.get(appointment.professionalId) ?? "Unknown",
		}));

		return ok(result);
	}

	async findByClientId(clientId: string, page: number, limit: number) {
		const filtered = this.items.filter((a) => {
			return a.clientId === clientId && !a.deletedAt;
		});
		const offset = (page - 1) * limit;
		const items = filtered.slice(offset, offset + limit);

		return ok({ items, total: filtered.length });
	}

	async create(data: CreateAppointmentInput) {
		const id = crypto.randomUUID();

		const appointment: Appointment = {
			id,
			uid: data.uid ?? `${id}@appointment.local`,
			summary: data.summary,
			description: data.description ?? null,
			dtstart: new Date(data.dtstart),
			dtend: new Date(data.dtend),
			timezone: data.timezone ?? "UTC",
			rrule: data.rrule ?? null,
			status: data.status ?? "CONFIRMED",
			sequence: data.sequence ?? 0,
			dtstamp: new Date(),
			deletedAt: null,
			clientId: data.clientId,
			professionalId: data.professionalId,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		this.items.push(appointment);

		return ok(appointment);
	}

	async findById(id: string) {
		const appointment = this.items.find((item) => {
			return item.id === id && !item.deletedAt;
		});

		if (!appointment) {
			return err(this.createNotFound(id));
		}

		return ok(appointment);
	}

	private createNotFound(id: string): NotFoundError {
		return new NotFoundError("Appointment", id);
	}

	private async updateAtIndex(
		id: string,
		updater: (appointment: Appointment) => Appointment,
	) {
		const index = this.items.findIndex((item) => {
			return item.id === id && !item.deletedAt;
		});

		if (index === -1) {
			return err(this.createNotFound(id));
		}

		const current = this.items[index];
		const updated = updater(current);

		this.items[index] = updated;

		return ok(updated);
	}

	async update(id: string, data: UpdateAppointmentInput) {
		const result = await this.updateAtIndex(id, (current) => ({
			...current,
			...(data.uid !== undefined && { uid: data.uid }),
			...(data.summary !== undefined && { summary: data.summary }),
			...(data.description !== undefined && {
				description: data.description,
			}),
			...(data.dtstart !== undefined && {
				dtstart: new Date(data.dtstart),
			}),
			...(data.dtend !== undefined && { dtend: new Date(data.dtend) }),
			...(data.timezone !== undefined && { timezone: data.timezone }),
			...("rrule" in data && { rrule: data.rrule ?? null }),
			...(data.status !== undefined && { status: data.status }),
			...(data.sequence !== undefined && { sequence: data.sequence }),
			...(data.sequence === undefined && { sequence: current.sequence + 1 }),
			...(data.professionalId !== undefined && {
				professionalId: data.professionalId,
			}),
			dtstamp: new Date(),
			updatedAt: new Date(),
		}));

		if (result.isErr()) {
			return err(result.error);
		}

		return ok(result.value);
	}

	async hasConflictInAppointments(
		professionalId: string,
		dtstart: Date,
		dtend: Date,
		excludedAppointmentId?: string,
	) {
		const hasConflict = this.items.some((appointment) => {
			if (appointment.deletedAt) {
				return false;
			}

			if (appointment.status === "CANCELLED") {
				return false;
			}

			if (appointment.professionalId !== professionalId) {
				return false;
			}

			if (excludedAppointmentId && appointment.id === excludedAppointmentId) {
				return false;
			}

			return appointment.dtstart < dtend && appointment.dtend > dtstart;
		});

		return ok(hasConflict);
	}

	async delete(id: string) {
		const result = await this.updateAtIndex(id, (current) => ({
			...current,
			status: "CANCELLED",
			sequence: current.sequence + 1,
			dtstamp: new Date(),
			deletedAt: new Date(),
			updatedAt: new Date(),
		}));

		return result.map(() => undefined);
	}

	setAppointments(appointments: Appointment[]) {
		this.setItems(appointments);
	}

	clearAppointments() {
		this.clearItems();
	}
}
