import { AuthController } from "./auth.controller";
import { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";

const repository = new AuthRepository();
const service = new AuthService(repository);
export const controller = new AuthController(service);
