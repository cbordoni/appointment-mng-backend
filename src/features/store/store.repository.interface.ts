import type { IRepository } from "@/common/repository/repository.interfance";
import type { Store } from "@/db/schema";

import type { CreateStoreInput, UpdateStoreInput } from "./store.types";

export interface IStoreRepository
	extends IRepository<Store, CreateStoreInput, UpdateStoreInput> {}
