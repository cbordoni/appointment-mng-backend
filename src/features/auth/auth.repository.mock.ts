import { err, ok } from "neverthrow";

import { NotFoundError } from "@/common/errors";
import type { Account } from "@/db/schema";

import type { IAuthRepository } from "./auth.repository.interface";

export class MockAuthRepository implements IAuthRepository {
	private accounts: Map<string, Account> = new Map();

	setAccounts(accounts: Account[]): void {
		this.accounts.clear();
		for (const account of accounts) {
			if (account.taxId) {
				this.accounts.set(account.taxId, account);
			}
		}
	}

	async findByTaxId(taxId: string) {
		const account = this.accounts.get(taxId);

		if (!account) {
			return err(new NotFoundError("Account", taxId));
		}

		return ok(account);
	}
}
