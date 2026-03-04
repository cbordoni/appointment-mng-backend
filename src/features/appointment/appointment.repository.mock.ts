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

			if (from && a.startDate < from) return false;

			if (to && a.startDate > to) return false;

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
		const appointment: Appointment = {
			id: crypto.randomUUID(),
			title: data.title,
			startDate: new Date(data.startDate),
			endDate: new Date(data.endDate),
			recurrence: data.recurrence ?? "none",
			active: data.active ?? true,
			deletedAt: null,
			observation: data.observation ?? null,
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
		return this.updateAtIndex(id, (current) => ({
			...current,
			...(data.title !== undefined && { title: data.title }),
			...(data.startDate !== undefined && {
				startDate: new Date(data.startDate),
			}),
			...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
			...(data.recurrence !== undefined && { recurrence: data.recurrence }),
			...(data.active !== undefined && { active: data.active }),
			...("observation" in data && { observation: data.observation ?? null }),
			...(data.professionalId !== undefined && {
				professionalId: data.professionalId,
			}),
			updatedAt: new Date(),
		}));
	}

	async hasConflictInAppointments(
		professionalId: string,
		startDate: Date,
		endDate: Date,
		excludedAppointmentId?: string,
	) {
		const hasConflict = this.items.some((appointment) => {
			if (appointment.deletedAt) {
				return false;
			}

			if (!appointment.active) {
				return false;
			}

			if (appointment.professionalId !== professionalId) {
				return false;
			}

			if (excludedAppointmentId && appointment.id === excludedAppointmentId) {
				return false;
			}

			return appointment.startDate < endDate && appointment.endDate > startDate;
		});

		return ok(hasConflict);
	}

	async delete(id: string) {
		const result = await this.updateAtIndex(id, (current) => ({
			...current,
			active: false,
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
