const mung = require("express-mung")
// remove the _id property from everything using recursion magic

//
module.exports = mung.json(function (body) {
	const editResponse = (response) => {
		if (response && response.toObject) response = response.toObject()
		for (let prop in response) {
			if (prop == "_id") {
				delete response[prop]
			} else {
				if (response[prop]) {
					if (response[prop].toObject) response[prop] = response[prop].toObject()
					if (Array.isArray(response[prop])) response[prop] = editResponse(response[prop])
					if (typeof(response[prop]) == "object") response[prop] = editResponse(response[prop])
				}
			}
		}
		return response
	}
	return editResponse(body)
})