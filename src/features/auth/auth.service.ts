import { err, ok, type Result } from "neverthrow";

import { ValidationError } from "@/common/errors";
import { logger } from "@/common/logger";
import type { Account } from "@/db/schema";

import type { IAuthRepository } from "./auth.repository.interface";
import type { AuthPayload, LoginInput } from "./auth.types";

export class AuthService {
	constructor(private readonly repository: IAuthRepository) {}

	private validateTaxId(taxId: string): Result<void, ValidationError> {
		return taxId.trim().length === 0
			? err(new ValidationError("TaxId cannot be empty"))
			: ok(undefined);
	}

	private validatePassword(password: string): Result<void, ValidationError> {
		return password.length < 8
			? err(new ValidationError("Password must be at least 8 characters"))
			: ok(undefined);
	}

	private async verifyPassword(
		password: string,
		passwordHash: string,
	): Promise<boolean> {
		return Bun.password.verify(password, passwordHash);
	}

	private mapToAuthPayload(account: Account): AuthPayload {
		return {
			accountId: account.id,
			taxId: account.taxId || "",
			name: account.name,
		};
	}

	async login(
		input: LoginInput,
	): Promise<Result<AuthPayload, ValidationError>> {
		logger.debug("Attempting login with taxId", { taxId: input.taxId });

		const taxIdValidation = this.validateTaxId(input.taxId);
		if (taxIdValidation.isErr()) {
			return err(taxIdValidation.error);
		}

		const passwordValidation = this.validatePassword(input.password);
		if (passwordValidation.isErr()) {
			return err(passwordValidation.error);
		}

		const accountResult = await this.repository.findByTaxId(input.taxId);

		if (accountResult.isErr()) {
			logger.warn("Account not found for taxId", { taxId: input.taxId });
			return err(new ValidationError("Invalid credentials"));
		}

		const account = accountResult.value;

		const passwordMatch = await this.verifyPassword(
			input.password,
			account.passwordHash,
		);

		if (!passwordMatch) {
			logger.warn("Password mismatch for taxId", { taxId: input.taxId });
			return err(new ValidationError("Invalid credentials"));
		}

		logger.debug("Login successful for taxId", { taxId: input.taxId });

		return ok(this.mapToAuthPayload(account));
	}
}
