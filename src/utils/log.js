const mung = require("express-mung")
const LogSchema = require("../database/fagc/log")

// https://stackoverflow.com/questions/19215042/express-logging-response-body

module.exports = mung.json(function(body, req) {
	if (req.method === "GET") return
	let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
	if (ip.includes(":") && ip !== "::1") ip = ip.slice(0, ip.indexOf(":"))
	LogSchema.create({
		timestamp: new Date(),
		apikey: req.headers.apikey,
		ip: ip,
		responseBody: body,
		requestBody: req.body,
		endpointAddress: req.originalUrl
	})
})