import { AccountRepository } from "../account/account.repository";
import { ClientController } from "./client.controller";
import { ClientRepository } from "./client.repository";
import { ClientService } from "./client.service";

const repository = new ClientRepository();
const accountRepository = new AccountRepository();
const service = new ClientService(repository, accountRepository);
export const controller = new ClientController(service);
