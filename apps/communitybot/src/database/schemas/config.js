const mongoose = require("mongoose")

const ConfigSchema = new mongoose.Schema({
	communityname: {
		type: String,
		required: true
	},
	communityid: String, // the community ID in the fagc database
	guildid: {
		type: String,
		required: true,
	},
	contact: {
		type: String,
		required: true,
	},
	apikey: String,
	moderatorroleId: String,
	trustedCommunities: [String],
	ruleFilters: [String],
	roles: {
		violations: { type: String, default: "" },
		webhooks: { type: String, default: "" },
		setConfig: { type: String, default: "" },
		setRules: { type: String, default: "" },
		setCommunities: { type: String, default: "" },
	}
})

module.exports = mongoose.model("config", ConfigSchema)