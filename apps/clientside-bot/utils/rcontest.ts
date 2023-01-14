// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

// This code is written in deno
// Use the "deno.enablePaths" setting to enable only this file for deno linting

import Server from "https://deno.land/x/rcon_server@v1.0.1/mod.ts"

const server = new Server("127.0.0.1", 27015, "password")

const banlist = new Map<string, string>()

const readBanlist = JSON.parse(Deno.readTextFileSync("banlist.json"))
readBanlist.forEach(
	({ playername, reason }: { playername: string; reason: string }) => {
		banlist.set(playername, reason)
	}
)

server.on("connection", () => console.log("connection"))
server.on("request", (id, message) => {
	server.reply(id, message.id, "")

	if (message.body === "/banlist clear") {
		banlist.clear()
		return
	} else if (message.body === "/banlist output") {
		console.log(banlist)
	}

	const parsedCommands = message.body
		.slice(3)
		.split(";")
		.map((x) => x.trim())

	const banRegex = /game.ban_player\("(.+)", "(.+)"\)/
	const unbanRegex = /game.unban_player\("(.+)"\)/
	for (const command of parsedCommands) {
		if (command.startsWith("game.ban_player")) {
			const match = banRegex.exec(command)
			if (!match) continue
			const [, playername, reason] = match
			banlist.set(playername, reason)
			console.log("ban ", playername)
		} else if (command.startsWith("game.unban_player")) {
			const match = unbanRegex.exec(command)
			if (!match) continue
			const [, playername] = match
			banlist.delete(playername)
			console.log("unban ", playername)
		}
	}
})

const writeBanlist = () => {
	const data = Array.from(banlist.entries()).map(([playername, reason]) => {
		return {
			playername,
			reason,
		}
	})
	const json = JSON.stringify(data, null, 2)
	Deno.writeTextFileSync("banlist.json", json)
}

setInterval(() => writeBanlist(), 15 * 1000)
