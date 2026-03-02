import { Queue } from "bullmq";

import {
	APPOINTMENT_NOTIFICATION_QUEUE,
	createRedisConnection,
} from "@/features/scheduler/scheduler.constants";
import { SchedulerService } from "@/features/scheduler/scheduler.service";
import type { ScheduledJob } from "@/features/scheduler/scheduler.types";

import { AppointmentController } from "./appointment.controller";
import { AppointmentRepository } from "./appointment.repository";
import { AppointmentService } from "./appointment.service";

const queue = new Queue<ScheduledJob>(APPOINTMENT_NOTIFICATION_QUEUE, {
	connection: createRedisConnection(),
});

const repository = new AppointmentRepository();
const scheduler = new SchedulerService(queue);
const service = new AppointmentService(repository, scheduler);

export const controller = new AppointmentController(service);
