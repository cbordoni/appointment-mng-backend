import { AppointmentProjectionController } from "./appointment-projection.controller";
import { AppointmentProjectionRepository } from "./appointment-projection.repository";
import { AppointmentProjectionService } from "./appointment-projection.service";

const repository = new AppointmentProjectionRepository();
const service = new AppointmentProjectionService(repository);

export const controller = new AppointmentProjectionController(service);
