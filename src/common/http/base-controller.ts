import {
	DatabaseError,
	type DomainError,
	HttpErrorResponse,
	NotFoundError,
	ValidationError,
} from "@/common/errors";

export abstract class BaseController {
	protected handleError(error: DomainError): HttpErrorResponse {
		if (error instanceof NotFoundError) {
			return new HttpErrorResponse(error.message, error.code, 404);
		}

		if (error instanceof ValidationError) {
			return new HttpErrorResponse(error.message, error.code, 400);
		}

		if (error instanceof DatabaseError) {
			return new HttpErrorResponse("Internal server error", error.code, 500);
		}

		return new HttpErrorResponse(
			"Internal server error",
			"INTERNAL_ERROR",
			500,
		);
	}
}
