process.chdir(__dirname)

// extenders so they can be used anywhere
// import "./utils/extenders"

import express from "express"
import path from "path"
import cookieParser from "cookie-parser"
import morgan from "morgan"
import cors from "cors"

import logger from "./utils/log"
import removeId from "./utils/removeId"
import authUser from "./utils/authUser"

import * as Sentry from "@sentry/node"
import * as Tracing from "@sentry/tracing"

import ruleRouter from "./routes/rules"
import communityRouter from "./routes/communities"
import reportRouter from "./routes/reports"
import informaticsRouter from "./routes/informatics"
import revocationRouter from "./routes/revocations"
import profileRouter from "./routes/profiles"

import ENV from "./utils/env"

const app = express()

Sentry.init({
	dsn: ENV.SENTRY_LINK,
	integrations: [
		// enable HTTP calls tracing
		new Sentry.Integrations.Http({ tracing: true }),
		// enable Express.js middleware tracing
		new Tracing.Integrations.Express({ app }),
	],

	// Set tracesSampleRate to 1.0 to capture 100%
	// of transactions for performance monitoring.
	// We recommend adjusting this value in production
	tracesSampleRate: 1.0,
})

// RequestHandler creates a separate execution context using domains, so that every
// transaction/span/breadcrumb is attached to its own Hub instance
app.use(Sentry.Handlers.requestHandler())
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler())

// API rate limits
import rateLimit from "express-rate-limit"
const localIPs = [
	"::ffff:127.0.0.1",
	"::1"
]
const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,	// 15 minutes
	max: 10000,	// 10000 requests in timeframe
	// lookup: 'connection.remoteAddress',
	skip: (req) => {
		const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
		if (!ip) return false
		if (localIPs.includes(Array.isArray(ip) ? ip[0] : ip)) return true
		else return false
	},
	message: JSON.stringify({
		error: "Too Many Requests",
		description: "You have sent too many requests. Please try again laterp"
	}),
	statusCode: 429,
})
app.use(apiLimiter)

// view engine setup
app.set("views", path.join(__dirname, "views"))
app.set("view engine", "jade")

// app.set('trust proxy', true)
app.use(cors())
app.use(morgan("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, "public")))

// logger for any request other than POST
app.use(logger)
app.use(removeId)

// middleware for authentication
const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
	const authenticated = await authUser(req)
	// When running on localhost, IP shows v4 as v6. use ngrok to test IP stuff locally
	// console.debug(req.headers['x-forwarded-for'] || req.socket.remoteAddress) // get origin IP
	if (authenticated === 400)
		return res.status(400).json({ error: "AuthenticationError", description: "apikey was an array" })
	if (authenticated === 404)
		return res.status(404).json({ error: "AuthenticationError", description: "API key is wrong" })
	if (authenticated === 401)
		return res.status(401).json({ error: "AuthenticationError", description: "IP adress whitelist mismatch" })
	next()
}

// Informatics router should be publicly available to anyone who wants to use it (logs & webhooks)
// this is why it is first, before the authentication middleware.
app.use("/v1/informatics", informaticsRouter)
app.use("/v1/*", authMiddleware)

app.use("/v1/rules", ruleRouter)
app.use("/v1/communities", communityRouter)
app.use("/v1/reports", reportRouter)
app.use("/v1/revocations", revocationRouter)
app.use("/v1/profiles", profileRouter)

app.get("/v1", (req, res) => {
	res.status(200).json({ message: "FAGC api v1" })
})
app.get("/", (req, res) => {
	res.status(200).json({ message: "FAGC api" })
})

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler())

app.use((req: express.Request, res: express.Response) => {
	res.status(404).json({ error: "404 Not Found", message: `Path ${req.path} does not exist on this API` })
})

// statistics
import "./utils/Prometheus"

app.listen(ENV.EXPRESS_PORT, () => {
	console.log(`API listening on port ${ENV.EXPRESS_PORT}`)
})