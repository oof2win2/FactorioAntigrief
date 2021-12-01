import { FastifyReply, FastifyRequest } from "fastify"
// remove the _id property from everything using recursion magic

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default async function (
	_req: FastifyRequest,
	res: FastifyReply,
	payload: unknown
) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const editResponse = (response: any) => {
		const removeable = [ "_id", "__v", "apikey", "userAuth" ]
		if (response && response.toObject) response = response.toObject()
		for (const prop in response) {
			if (removeable.includes(prop)) {
				delete response[prop]
			} else {
				if (response[prop]) {
					if (response[prop].toObject)
						response[prop] = response[prop].toObject()
					if (Array.isArray(response[prop]))
						response[prop] = editResponse(response[prop])
					if (typeof response[prop] == "object")
						response[prop] = editResponse(response[prop])
				}
			}
		}
		return response
	}

	// make sure to not modify response if it is not json
	if (!res.getHeader("content-type")?.startsWith("application/json"))
		return payload

	// most responses are JSON so this should go through
	if (typeof payload === "string") {
		try {
			const newPayload = editResponse(JSON.parse(payload))
			return JSON.stringify(newPayload)
		} catch (e) {
			const newPayload = editResponse(payload)
			return newPayload
		}
	}
	try {
		const newPayload = editResponse(payload)
		return JSON.stringify(newPayload)
	} catch (e) {
		return payload
	}
}
