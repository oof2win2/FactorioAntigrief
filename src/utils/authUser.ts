import authentication from "../database/fagc/authentication"
import express from "express"

/**
 * @description Checks the authentication of a user by searching the database with the API key
 * @param {express.Request} - Request to the API 
 * @returns {Promise<number>} - 200 if OK, 401 if wrong IP, 404 if key not found / doesn't belong to anyone, 400 if header was an array
 */
const authenticate = async (req: express.Request): Promise<number> => {
	if (req.method === "GET") return 200
	let auth = req.headers["authorization"]
	if (!auth) return 404 // no api key
	if (Array.isArray(auth) && typeof auth[0] === "string") auth = auth[0]
	else if (Array.isArray(auth)) return 404

	if (auth.startsWith("Bearer ")) {
		// const foundUser = await
	}
	else if (auth.startsWith("Token ")) {
		const token = auth.slice(auth.indexOf("Token ") + "Token ".length)
		const dbRes = await authentication.findOne({ api_key: token })
		if (!dbRes) return 404 // API key not found

		// api key is now confirmed to be correct
		return 200
	}
	return 400
}

export default authenticate