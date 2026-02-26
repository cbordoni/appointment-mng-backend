/**
 * Removes undefined values from an object
 * @param obj - The object to clean
 * @returns A new object with undefined values removed
 */
export function removeUndefined<T extends Record<string, unknown>>(
	obj: T,
): Partial<T> {
	const result: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(obj)) {
		if (value !== undefined) {
			result[key] = value;
		}
	}

	return result as Partial<T>;
}
