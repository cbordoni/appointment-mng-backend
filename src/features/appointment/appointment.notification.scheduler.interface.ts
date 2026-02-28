import type { Result } from "neverthrow";

import type { Appointment } from "@/db/schema";

import type { AppointmentNotificationError } from "./appointment.notification.scheduler";

// biome-ignore format: to keep the type definition clear and consistent
type AppointmentScheduleResult = Promise<Result<void, AppointmentNotificationError>>;

export interface IAppointmentNotificationScheduler {
	// biome-ignore format: to keep the method signatures clear and consistent
	scheduleForAppointment(appointment: Appointment): AppointmentScheduleResult;

	// biome-ignore format: to keep the method signatures clear and consistent
	rescheduleForAppointment(appointment: Appointment): AppointmentScheduleResult;

	// biome-ignore format: to keep the method signatures clear and consistent
	clearForAppointment(appointmentId: string): AppointmentScheduleResult;
}
