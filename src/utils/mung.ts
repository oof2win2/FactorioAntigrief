import { NextFunction, Request, Response, RequestHandler } from "express"

// code copied directly from https://www.npmjs.com/package/express-mung
// just made it less annoying as it doesn't send an empty response if the response is null
// not typescript because idk how

interface Options {
	mungError: boolean
}
type TransformAsync = (body: {}, request: Request, response: Response) => Promise<any>
type Transform = (body: {}, request: Request, response: Response) => any;

function onError (err: unknown, req: Request, res: Response, next: NextFunction) {
	res
		.status(500)
		.json({message: err})
	return res
}

let faux_fin = { end: () => null }

function isScalar(v) {
	return typeof v !== "object" && !Array.isArray(v)
}

const mung = {
	json: function (fn: Transform, opts: Options = {mungError: true}): RequestHandler {
		return function (req, res, next) {
			let original = res.json
			function json_hook(json) {
				let originalJson = json
				res.json = original
				if (res.headersSent) return res
				if (res.statusCode >= 400) return res.json(json)
	
				// Run the munger
				try {
					json = fn(json, req, res)
				} catch (e) {
					return onError(e, req, res, next)
				}
				if (res.headersSent)
					return res
	
				// If no returned value from fn, then assume json has been mucked with.
				if (json === undefined)
					json = originalJson
	
				if (json === null || json === undefined)
					return res.status(404).json(null)
	
				// If munged scalar value, then text/plain
				if (originalJson !== json && isScalar(json)) {
					res.set("content-type", "text/plain")
					return res.send(String(json))
				}
	
				return res.json(json)
			}
			res.json = json_hook
	
			next && next()
		}
	}
}
export default mung