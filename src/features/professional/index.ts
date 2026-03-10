import { ProfessionalController } from "./professional.controller";
import { ProfessionalRepository } from "./professional.repository";
import { ProfessionalService } from "./professional.service";

const repository = new ProfessionalRepository();
const service = new ProfessionalService(repository);
export const controller = new ProfessionalController(service);
