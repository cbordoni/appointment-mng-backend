import { ok, type Result } from "neverthrow";

import type { NotFoundError } from "@/common/errors";
import type { Appointment } from "@/db/schema";
import { BaseInMemoryRepository } from "@/testing/base-in-memory-repository";

import type { IAppointmentRepository } from "./appointment.repository.interface";
import type {
	AppointmentWithUser,
	CreateAppointmentInput,
	UpdateAppointmentInput,
} from "./appointment.types";

export class MockAppointmentRepository
	extends BaseInMemoryRepository<Appointment>
	implements IAppointmentRepository
{
	private usersMap = new Map<string, string>();

	protected get entityName(): string {
		return "Appointment";
	}

	setUsersMap(map: Map<string, string>) {
		this.usersMap = map;
	}

	async findAll(page: number, limit: number) {
		return super.findAll(page, limit);
	}

	async findByDateRange(
		from?: Date,
		to?: Date,
	): Promise<Result<AppointmentWithUser[], never>> {
		const filtered = this.items.filter((a) => {
			if (from && a.startDate < from) return false;

			if (to && a.startDate > to) return false;

			return true;
		});

		const result = filtered.map(({ userId, ...rest }) => ({
			...rest,
			userName: this.usersMap.get(userId) ?? "Unknown",
		}));

		return ok(result);
	}

	async findByUserId(userId: string, page: number, limit: number) {
		const filtered = this.items.filter((a) => a.userId === userId);
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
			observation: data.observation ?? null,
			userId: data.userId,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		this.items.push(appointment);

		return ok(appointment);
	}

	private async updateAtIndex(
		id: string,
		updater: (appointment: Appointment) => Appointment,
	) {
		const indexResult = await this.findIndexById(id);

		if (indexResult.isErr()) {
			return indexResult as Result<never, NotFoundError>;
		}

		const index = indexResult.value;
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
			...("observation" in data && { observation: data.observation ?? null }),
			updatedAt: new Date(),
		}));
	}

	setAppointments(appointments: Appointment[]) {
		this.setItems(appointments);
	}

	clearAppointments() {
		this.clearItems();
	}
}
