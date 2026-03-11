import { StoreRepository } from "../store/store.repository";
import { ProfessionalController } from "./professional.controller";
import { ProfessionalRepository } from "./professional.repository";
import { ProfessionalService } from "./professional.service";

const repository = new ProfessionalRepository();
const storeRepository = new StoreRepository();
const service = new ProfessionalService(repository, storeRepository);
export const controller = new ProfessionalController(service);
