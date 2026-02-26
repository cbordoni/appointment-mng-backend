import { Elysia } from "elysia";

import { HttpErrorResponse } from "@/common/errors";

export const httpErrorMapperPlugin = new Elysia({
	name: "http-error-mapper",
}).onAfterHandle(({ responseValue, set }) => {
	if (responseValue instanceof HttpErrorResponse) {
		set.status = responseValue.status;

		return {
			error: responseValue.message,
			code: responseValue.code,
		};
	}

	return responseValue;
});
