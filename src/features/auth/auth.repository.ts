import { and, eq, isNull } from "drizzle-orm";
import { err, ok } from "neverthrow";

import { NotFoundError } from "@/common/errors";
import { wrapDatabaseOperation } from "@/common/utils/database";
import { db } from "@/db";
import { accounts } from "@/db/schema";

import type { IAuthRepository } from "./auth.repository.interface";

export class AuthRepository implements IAuthRepository {
	async findByTaxId(taxId: string) {
		const result = await wrapDatabaseOperation(
			() =>
				db
					.select()
					.from(accounts)
					.where(and(eq(accounts.taxId, taxId), isNull(accounts.deletedAt))),
			"Failed to fetch account by taxId",
		);

		return result.andThen(([account]) => {
			if (!account) {
				return err(new NotFoundError("Account", taxId));
			}

			return ok(account);
		});
	}
}
