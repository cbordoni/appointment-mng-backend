import { AccountRepository } from "../account/account.repository";
import { ProfessionalController } from "./professional.controller";
import { ProfessionalRepository } from "./professional.repository";
import { ProfessionalService } from "./professional.service";

const repository = new ProfessionalRepository();
const accountRepository = new AccountRepository();
const service = new ProfessionalService(repository, accountRepository);
export const controller = new ProfessionalController(service);
