import { StoreRepository } from "../store/store.repository";
import { ClientController } from "./client.controller";
import { ClientRepository } from "./client.repository";
import { ClientService } from "./client.service";

const repository = new ClientRepository();
const storeRepository = new StoreRepository();
const service = new ClientService(repository, storeRepository);
export const controller = new ClientController(service);
