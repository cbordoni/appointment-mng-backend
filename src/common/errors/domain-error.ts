export class DomainError extends Error {
	constructor(
		message: string,
		public readonly code: string = "DOMAIN_ERROR",
	) {
		super(message);
		this.name = "DomainError";
	}
}

export class NotFoundError extends DomainError {
	constructor(resource: string, id?: string) {
		super(
			id ? `${resource} with id ${id} not found` : `${resource} not found`,
			"NOT_FOUND",
		);
		this.name = "NotFoundError";
	}
}

export class ValidationError extends DomainError {
	constructor(message: string) {
		super(message, "VALIDATION_ERROR");
		this.name = "ValidationError";
	}
}

export class DatabaseError extends DomainError {
	constructor(message: string) {
		super(message, "DATABASE_ERROR");
		this.name = "DatabaseError";
	}
}

export class HttpErrorResponse extends Error {
	constructor(
		public readonly message: string,
		public readonly code: string,
		public readonly status: number,
	) {
		super(message);
		this.name = "HttpErrorResponse";
	}
}
