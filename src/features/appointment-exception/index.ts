import { AppointmentExceptionController } from "./appointment-exception.controller";
import { AppointmentExceptionRepository } from "./appointment-exception.repository";
import { AppointmentExceptionService } from "./appointment-exception.service";

const repository = new AppointmentExceptionRepository();
const service = new AppointmentExceptionService(repository);
export const controller = new AppointmentExceptionController(service);
