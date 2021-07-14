export function getUserStringFromID(string: string): string {
	const startBuf = Buffer.alloc(2, string.slice(2, 6), "hex")
	const endBuf = Buffer.alloc(3, string.slice(18), "hex")
	let start = startBuf.toString("base64").slice(0, -1) // remove first char as doesn't change often enough, last two and == as those change too often
	let end = endBuf.toString("base64")
	return start + end
}

// validate IDs that are visible to users
export function validateUserString(string: string): boolean {
	if (typeof string !== "string") return false // it's not a string so it's obviously wrong
	if (string.length !== 7) return false
	return true
}