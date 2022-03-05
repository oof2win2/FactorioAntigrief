/**
 * A function that generates a random ID of a specific length
 * @param length The length of the ID to generate
 * @returns A random ID of the specified length
 */
export const generateId = function (length: number): string {
	const genID = (length: number, prefix = ""): string => {
		prefix += Math.random().toString(36).substring(2, length)
		if (prefix.length > length) return prefix.slice(0, length)
		return genID(length, prefix)
	}

	return genID(length)
}
