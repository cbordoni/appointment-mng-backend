import { AppointmentOverrideController } from "./appointment-override.controller";
import { AppointmentOverrideRepository } from "./appointment-override.repository";
import { AppointmentOverrideService } from "./appointment-override.service";

const repository = new AppointmentOverrideRepository();
const service = new AppointmentOverrideService(repository);
export const controller = new AppointmentOverrideController(service);
