import { StoreController } from "./store.controller";
import { StoreRepository } from "./store.repository";
import { StoreService } from "./store.service";

const repository = new StoreRepository();
const service = new StoreService(repository);
export const controller = new StoreController(service);
