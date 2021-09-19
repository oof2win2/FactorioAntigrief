import config from "./testconfig"
import { FAGCWrapper, RequestConfig } from "../src/index"
import { CommunityConfig, Report, Revocation } from "fagc-api-types"

import { expect } from "chai"

import { step } from "mocha-steps"

const FAGC = new FAGCWrapper({
	apikey: config.apikey,
	socketurl: config.websocketurl,
	apiurl: config.apiurl,
	masterapikey: config.masterapikey,
})

const testGuildId = "749943992719769613"
const testUserId = "429696038266208258"
const testStuff = {
	report: {
		automated: false,
		description:
			"tortor posuere ac ut consequat semper viverra nam libero justo laoreet sit amet cursus sit amet dictum sit amet justo",
		proof: "tortor posuere ac ut consequat semper viverra nam libero justo laoreet sit amet cursus sit amet dictum sit amet justo",
		playername: "Windsinger",
	},
	reportCount: 5,
	webhookId: "865254241533820959",
	webhookToken:
		"m_ROP6uDvag5okV9YcrC9KkxBZ5sWgRDTCcnhrVdQGCi78W29-5jyflOsl1M6PFqoimn",
	rule: {
		shortdesc: "Some rule short description",
		longdesc: "Some rule long description",
	},
	community: {
		name: "Testing Community Alpha",
	},
}

const run = async () => {
	await FAGC.users.fetchUser("429696038266208258").then(console.log)
	await FAGC.users.removeUserFromCommunity("429696038266208258")
	await FAGC.users.fetchUser("429696038266208258").then(console.log)
}

run().then(() => FAGC.destroy())
