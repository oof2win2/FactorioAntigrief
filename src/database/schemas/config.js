const mongoose = require("mongoose")

const ConfigSchema = new mongoose.Schema({
	communityname: {
		type: String,
		required: true
	},
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
	ruleFilters: [String]
})

module.exports = mongoose.model("config", ConfigSchema)