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

const mung = {
	json: function (fn: Transform, opts: Options = {mungError: true}): RequestHandler {
		return function (req, res, next) {
			let original = res.json
			function json_hook(json) {
				let originalJson = json
				res.json = original
				if (res.headersSent) return res
				if (res.statusCode >= 400) return original.call(this, json)
	
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
	
				return original.call(this, json)
			}
			res.json = json_hook
	
			next && next()
		}
	},
	jsonAsync: function (fn: TransformAsync, options: Options = {mungError: true}) {
		return function (req: Request, res: Response, next: NextFunction) {
			let original = res.json
			let mungError = options.mungError
	
			function json_async_hook(json) {
				let originalJson = json
				res.json = original
				if (res.headersSent)
					return
				if (!mungError && res.statusCode >= 400)
					return original.call(this, json)
				try {
					fn(json, req, res)
						.then(json => {
							if (res.headersSent)
								return
	
							if (json === null || json === undefined)
								return res.status(404).json(null)
	
							// If munged scalar value, then text/plain
							if (json !== originalJson && isScalar(json)) {
								res.set("content-type", "text/plain")
								return res.send(String(json))
							}
	
							return original.call(this, json)
						})
						.catch(e => onError(e, req, res, next))
				} catch (e) {
					onError(e, req, res, next)
				}
	
				return faux_fin
			}
			res.json = json_async_hook
	
			next && next()
		}
	}
}
export default mung