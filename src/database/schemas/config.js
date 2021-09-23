const mongoose = require("mongoose")

const ConfigSchema = new mongoose.Schema({
	communityname: {
		type: String,
		required: true,
	},
	communityId: String, // the community ID in the fagc database
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
	ruleFilters: [String],
	roles: {
		reports: { type: String, default: "" },
		webhooks: { type: String, default: "" },
		setConfig: { type: String, default: "" },
		setRules: { type: String, default: "" },
		setCommunities: { type: String, default: "" },
	},
})

module.exports = mongoose.model("config", ConfigSchema)
