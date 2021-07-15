import authentication from "../database/fagc/authentication"
import express from "express"

/**
 * @description Checks the authentication of a user by searching the database with the API key
 * @param {express.Request} - Request to the API 
 * @returns {Promise<number>} - 200 if OK, 401 if wrong IP, 404 if key not found / doesn't belong to anyone, 400 if header was an array
 */
const authenticate = async (req: express.Request): Promise<number> => {
	if (req.method === "GET") return 200
	if (req.headers.apikey === undefined) return 404 // no api key
	if (Array.isArray(req.headers.apikey)) return 400 // headers were an array so that's wrong
	const dbRes = await authentication.findOne({ api_key: req.headers.apikey })
	if (dbRes === undefined || dbRes === null) return 404 // API key not found

	// api key is now confirmed to be correct

	// if whitelisted IPs are set. will have issues with IPv6 adresses since they have semicolons in them
	const ip = 
		Array.isArray(req.headers["x-forwarded-for"])
		? req.headers["x-forwarded-for"][0]
		: req.headers["x-forwarded-for"]
		|| req.socket.remoteAddress
	if (!ip) return 401 // no ip so no way to check
	if (dbRes.allowed_ips[0] == undefined) return 200
	else if (dbRes.allowed_ips.includes(ip)) return 200 // API key is correct and IP adress is correct
	return 401  // API key is correct, but wrong IP adress
}

export default authenticate