import { err, ok, type Result } from "neverthrow";

import { NotFoundError } from "@/common/errors";
import type { Appointment, AppointmentEvent } from "@/db/schema";
import { BaseInMemoryRepository } from "@/testing/base-in-memory-repository";

import type { IAppointmentRepository } from "./appointment.repository.interface";
import type {
	AppointmentProjection,
	AppointmentWithClient,
	CreateAppointmentEventInput,
	CreateAppointmentInput,
	UpdateAppointmentInput,
} from "./appointment.types";

export class MockAppointmentRepository
	extends BaseInMemoryRepository<Appointment>
	implements IAppointmentRepository
{
	private clientsMap = new Map<string, string>();
	private professionalsMap = new Map<string, string>();
	private events: AppointmentEvent[] = [];

	private addRecurrenceDate(date: Date, recurrence: "weekly" | "monthly") {
		const nextDate = new Date(date);

		if (recurrence === "weekly") {
			nextDate.setDate(nextDate.getDate() + 7);
			return nextDate;
		}

		nextDate.setMonth(nextDate.getMonth() + 1);

		return nextDate;
	}

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

	async findNonRecurringByDateRange(
		from?: Date,
		to?: Date,
	): Promise<Result<AppointmentProjection[], never>> {
		const filtered = this.items.filter((appointment) => {
			if (appointment.deletedAt) return false;

			if (appointment.recurrence !== "none") return false;

			if (from && appointment.startDate < from) return false;

			if (to && appointment.startDate > to) return false;

			return true;
		});

		return ok(
			filtered.map((appointment) => ({
				sourceAppointmentId: appointment.id,
				title: appointment.title,
				startDate: appointment.startDate,
				endDate: appointment.endDate,
				observation: appointment.observation,
				recurrence: appointment.recurrence,
				clientName: this.clientsMap.get(appointment.clientId) ?? "Unknown",
				professionalName:
					this.professionalsMap.get(appointment.professionalId) ?? "Unknown",
			})),
		);
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

	async findProjectedByDateRange(
		from?: Date,
		to?: Date,
	): Promise<Result<AppointmentProjection[], never>> {
		const rangeStart = from ?? new Date();
		const rangeEnd =
			to ?? new Date(rangeStart.getTime() + 1000 * 60 * 60 * 24 * 90);
		const projected: AppointmentProjection[] = [];

		for (const appointment of this.items) {
			if (
				appointment.deletedAt ||
				appointment.recurrence === "none" ||
				!appointment.active
			) {
				continue;
			}

			let currentStart = new Date(appointment.startDate);
			let currentEnd = new Date(appointment.endDate);
			let guard = 0;

			while (currentStart <= rangeEnd && guard < 600) {
				if (currentStart >= rangeStart) {
					projected.push({
						sourceAppointmentId: appointment.id,
						title: appointment.title,
						startDate: new Date(currentStart),
						endDate: new Date(currentEnd),
						observation: appointment.observation,
						recurrence: appointment.recurrence,
						clientName: this.clientsMap.get(appointment.clientId) ?? "Unknown",
						professionalName:
							this.professionalsMap.get(appointment.professionalId) ??
							"Unknown",
					});
				}

				currentStart = this.addRecurrenceDate(
					currentStart,
					appointment.recurrence,
				);
				currentEnd = this.addRecurrenceDate(currentEnd, appointment.recurrence);
				guard += 1;
			}
		}

		projected.sort((left, right) => {
			return left.startDate.getTime() - right.startDate.getTime();
		});

		return ok(projected);
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

	async hasConflictInProjection(
		professionalId: string,
		startDate: Date,
		endDate: Date,
		excludedAppointmentId?: string,
	) {
		for (const appointment of this.items) {
			if (appointment.deletedAt || !appointment.active) {
				continue;
			}

			if (appointment.professionalId !== professionalId) {
				continue;
			}

			if (appointment.recurrence === "none") {
				continue;
			}

			if (excludedAppointmentId && appointment.id === excludedAppointmentId) {
				continue;
			}

			let currentStart = new Date(appointment.startDate);
			let currentEnd = new Date(appointment.endDate);
			let guard = 0;

			while (currentStart < endDate && guard < 600) {
				if (currentStart < endDate && currentEnd > startDate) {
					return ok(true);
				}

				currentStart = this.addRecurrenceDate(
					currentStart,
					appointment.recurrence,
				);
				currentEnd = this.addRecurrenceDate(currentEnd, appointment.recurrence);
				guard += 1;
			}
		}

		return ok(false);
	}

	async createEvent(appointmentId: string, data: CreateAppointmentEventInput) {
		const appointmentResult = await this.findById(appointmentId);

		if (appointmentResult.isErr()) {
			return err(appointmentResult.error);
		}

		const event: AppointmentEvent = {
			id: crypto.randomUUID(),
			appointmentId,
			status: data.status,
			summary: data.summary ?? null,
			originalStartDate: appointmentResult.value.startDate,
			originalEndDate: appointmentResult.value.endDate,
			actualStartDate: data.actualStartDate
				? new Date(data.actualStartDate)
				: null,
			actualEndDate: data.actualEndDate ? new Date(data.actualEndDate) : null,
			performedByClientId: data.performedByClientId ?? null,
			newAppointmentId: data.newAppointmentId ?? null,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		this.events.push(event);

		return ok(event);
	}

	async findEventsByAppointmentId(
		appointmentId: string,
	): Promise<Result<AppointmentEvent[], never>> {
		return ok(
			this.events.filter((event) => event.appointmentId === appointmentId),
		);
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
		this.events = [];
	}
}
