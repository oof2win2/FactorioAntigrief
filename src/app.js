const express = require("express")
const path = require("path")
const cookieParser = require("cookie-parser")
const morgan = require("morgan")

const logger = require("./utils/log")
const removeId = require("./utils/removeId")
const authUser = require("./utils/authUser")

const ruleRouter = require("./routes/rules")
const communityRouter = require("./routes/communities")
const violationRouter = require("./routes/violations")
const informaticsRouter = require("./routes/informatics")
const revocationRouter = require("./routes/revocations")
const offenseRouter = require("./routes/offenses")

const app = express()
const Sentry = require("@sentry/node")
const Tracing = require("@sentry/tracing")
const mung = require("express-mung")

const config = require("../config")

// extenders so they can be used anywhere
require("./utils/extenders")


Sentry.init({
	dsn: config.sentryLink,
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
const rateLimit = require("express-rate-limit")
const localIPs = [
	"::ffff:127.0.0.1",
	"::1"
]
const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,	// 15 minutes
	max: 100,	// 100 requests in timeframe
	// lookup: 'connection.remoteAddress',
	skip: (req) => {
		const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
		if (localIPs.includes(ip)) return true
		else return false
	}
})
app.use(apiLimiter)

// view engine setup
app.set("views", path.join(__dirname, "views"))
app.set("view engine", "jade")

// app.set('trust proxy', true)
app.use(morgan("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, "public")))

// logger for any request other than POST
app.use(logger)
app.use(removeId)
app.use(mung.json(function (body, req, res) { // make mung not send 204
	if (body == null || body == undefined) {
		body = {}
		res.status(200)
	}
	return body
}))

// middleware for authentication
const authMiddleware = async (req, res, next) => {
	const authenticated = await authUser(req)
	// When running on localhost, IP shows v4 as v6. use ngrok to test IP stuff locally
	// console.debug(req.headers['x-forwarded-for'] || req.socket.remoteAddress) // get origin IP
	if (authenticated === 404)
		return res.status(404).json({error: "AuthenticationError", description: "API key is wrong"})
	if (authenticated === 401)
		return res.status(401).json({error: "AuthenticationError", description: "IP adress whitelist mismatch"})
	next()
}

// Informatics router should be publicly available to anyone who wants to use it (logs & webhooks)
// this is why it is first, before the authentication middleware.
app.use("/v1/informatics", informaticsRouter)
app.use("/v1/*", authMiddleware)

app.use("/v1/rules", ruleRouter)
app.use("/v1/communities", communityRouter)
app.use("/v1/violations", violationRouter)
app.use("/v1/revocations", revocationRouter)
app.use("/v1/offenses", offenseRouter)

app.get("/v1", (req, res) => {
	res.status(200).json({message: "FAGC api v1"})
})
app.get("/", (req, res) => {
	res.status(200).json({ message: "FAGC api" })
})

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler())

app.use((req, res) => {
	res.status(404).json({ error: "404 Not Found", message: `Path ${req.path} does not exist on this API` })
})

// statistics
require("./utils/Prometheus")

module.exports = app
