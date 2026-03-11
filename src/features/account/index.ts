import { StoreRepository } from "../store/store.repository";
import { AccountController } from "./account.controller";
import { AccountRepository } from "./account.repository";
import { AccountService } from "./account.service";

const repository = new AccountRepository();
const storeRepository = new StoreRepository();
const service = new AccountService(repository, storeRepository);
export const controller = new AccountController(service);
