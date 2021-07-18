import config from "./testconfig"
import { FAGCWrapper } from "../src/index"
import { Revocation, Report, CommunityConfig } from "fagc-api-types"

const FAGC = new FAGCWrapper({
	apikey: config.apikey,
	socketurl: config.websocketurl,
	apiurl: config.apiurl,
	enableWebSocket: false
})

const testGuildId = "749943992719769613"
const testUserId = "429696038266208258"
const testStuff = {
	report: {
		automated: false,
		description: "i like potatoes",
		proof: "not gonna give it to ya",
		playername: "Windsinger",
	},
	reportCount: 5,
	webhookId: "865254241533820959",
	webhookToken: "m_ROP6uDvag5okV9YcrC9KkxBZ5sWgRDTCcnhrVdQGCi78W29-5jyflOsl1M6PFqoimn"
}
const run = async () => {
	const rules = await FAGC.rules.fetchAll()
	console.log(rules)
	// const report = await FAGC.reports.create({
	// 	brokenRule: rules[0].id,
	// 	adminId: testUserId,
	// 	...testStuff.report, // description, automated, proof, playername
	// })
	// console.log(report)
}
run().then(() => FAGC.destroy())