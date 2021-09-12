import { BotConfig } from "./types/FAGCBot"

const config: BotConfig = {
	token: "", // Discord bot token
	prefix: "banbot!", // Bot prefix
	apiurl: "http://localhost:3000/v1", // Base API url
	websocketurl: "ws://localhost:8001", // FAGC WS URL
	adminIDs: [ // Admins user IDs that can restart the bot etc. Shouldn't be a large number of people
		"429696038266208258"
	],
	embeds: { // Embed configs
		color: "GREEN",
		footer: "FAGC Team | oof2win2"
	},
	emotes: { // Some emotes
		error: ":x:",
		success: "<:success:841385407790317588>"
	},
	owner: {
		id: "429696038266208258",
		name: "oof2win2#3149"
	},
	rconport: 3000,
	rconpw: "aa",
	errorchannel: "749943993151782955",

	jailCommand: "/jail ${PLAYERNAME} ${REASON}",
	banCommand: "/ban ${PLAYERNAME} ${REASON}",
	unjailCommand: "/unjail ${PLAYERNAME}",
	unbanCommand: "/unban ${PLAYERNAME}",
}

export default config