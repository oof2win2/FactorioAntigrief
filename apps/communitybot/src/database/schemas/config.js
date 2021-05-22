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
		violations: String,
		webhooks: String,
		setConfig: String,
		setRules: String,
		setCommunities: String,
	}
})

module.exports = mongoose.model("config", ConfigSchema)