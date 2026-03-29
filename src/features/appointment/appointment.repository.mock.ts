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

	private belongsToStore(appointment: Appointment, storeId: string) {
		return appointment.storeId === storeId;
	}

	async findAll(page: number, limit: number, storeId: string) {
		const filtered = this.items.filter((appointment) => {
			return (
				!appointment.deletedAt && this.belongsToStore(appointment, storeId)
			);
		});
		const offset = (page - 1) * limit;
		const items = filtered.slice(offset, offset + limit);

		return ok({ items, total: filtered.length });
	}

	async findByDateRange(
		storeId: string,
		from?: Date,
		to?: Date,
	): Promise<Result<AppointmentWithClient[], never>> {
		const filtered = this.items.filter((appointment) => {
			if (appointment.deletedAt) {
				return false;
			}

			if (!this.belongsToStore(appointment, storeId)) {
				return false;
			}

			if (from && appointment.dtStart < from) {
				return false;
			}

			if (to && appointment.dtStart > to) {
				return false;
			}

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

	async findByClientId(
		clientId: string,
		page: number,
		limit: number,
		storeId: string,
	) {
		const filtered = this.items.filter((appointment) => {
			return (
				appointment.clientId === clientId &&
				!appointment.deletedAt &&
				this.belongsToStore(appointment, storeId)
			);
		});
		const offset = (page - 1) * limit;
		const items = filtered.slice(offset, offset + limit);

		return ok({ items, total: filtered.length });
	}

	async findByProfessionalId(
		professionalId: string,
		page: number,
		limit: number,
		storeId: string,
	): AsyncDomainResult<PaginatedResult<Appointment>> {
		const filtered = this.items.filter((appointment) => {
			return (
				appointment.professionalId === professionalId &&
				!appointment.deletedAt &&
				this.belongsToStore(appointment, storeId)
			);
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
			dtStart: new Date(data.dtStart),
			dtEnd: new Date(data.dtEnd),
			timezone: data.timezone ?? "UTC",
			rrule: data.rrule ?? null,
			status: data.status ?? "CONFIRMED",
			sequence: data.sequence ?? 0,
			dtstamp: new Date(),
			deletedAt: null,
			storeId: data.storeId,
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
			...(data.dtStart !== undefined && {
				dtStart: new Date(data.dtStart),
			}),
			...(data.dtEnd !== undefined && { dtEnd: new Date(data.dtEnd) }),
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
		dtStart: Date,
		dtEnd: Date,
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

			return appointment.dtStart < dtEnd && appointment.dtEnd > dtStart;
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
