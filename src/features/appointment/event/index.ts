import { AppointmentRepository } from "../appointment.repository";
import { AppointmentEventController } from "./event.controller";
import { AppointmentEventService } from "./event.service";

const repository = new AppointmentRepository();
const service = new AppointmentEventService(repository);

export const controller = new AppointmentEventController(service);
