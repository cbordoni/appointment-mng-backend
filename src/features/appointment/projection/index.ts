import { AppointmentRepository } from "../appointment.repository";
import { AppointmentProjectionController } from "./projection.controller";
import { AppointmentProjectionService } from "./projection.service";

const repository = new AppointmentRepository();
const service = new AppointmentProjectionService(repository);

export const controller = new AppointmentProjectionController(service);
