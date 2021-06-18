const database = require("../database")
const connection = database.connections.find((connection) => connection.n === "bot").c

// the thing from https://github.com/oof2win2/fagc-discord-bot/blob/dev/src/database/schemas/config.js

const ConfigSchema = new connection.Schema({
	communityname: {
		type: String,
		required: true
	},
	communityId: {
		type: connection.Types.ObjectId,
	},
	guildId: {
		type: String,
		required: true,
	},
	contact: {
		type: String,
		required: true,
	},
	apikey: String,
	moderatorRoleId: String,
	trustedCommunities: [String],
	ruleFilters: [String]
})

module.exports = connection.model("config", ConfigSchema)