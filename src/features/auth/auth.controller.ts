import { BaseController } from "@/common/http/base-controller";

import type { AuthService } from "./auth.service";
import type { LoginInput } from "./auth.types";

export class AuthController extends BaseController {
	constructor(private readonly service: AuthService) {
		super();
	}

	async login(data: LoginInput) {
		const result = await this.service.login(data);

		return result.match(
			(payload) => ({ data: payload, status: 200 }),
			this.handleError,
		);
	}
}
