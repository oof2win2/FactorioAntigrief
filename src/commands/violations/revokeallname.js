const fetch = require("node-fetch")
const strictUriEncode = require("strict-uri-encode")
const { MessageEmbed } = require("discord.js")
const { handleErrors, createPagedEmbed } = require("../../utils/functions")
const { getConfirmationMessage } = require("../../utils/responseGetter")
const Command = require("../../base/Command")
const { AuthenticationError } = require("fagc-api-wrapper")

class RevokeAllname extends Command {
	constructor(client) {
		super(client, {
			name: "revokeallname",
			description: "Revokes your profile of a player by profile ID (revoke all reports of a player by playername)",
			aliases: ["revokeprofile"],
			category: "reports",
			usage: "[playername]",
			examples: ["{{p}}revokeallname Windsinger"],
			dirname: __dirname,
			enabled: true,
			memberPermissions: ["BAN_MEMBERS"],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: true,
			customPermissions: ["reports"],
		})
	}
	async run(message, args, config) {
		if (!args[0]) return message.reply("Provide a player name to revoke reports of")
		const playername = args.shift()
		if (!config.apikey) return message.reply("No API key set")
		console.log(config)
		const profile = await this.client.fagc.profiles.fetchCommunity(playername, config.communityId)
		if (!profile || !profile.reports[0])
			return message.reply(`Player \`${playername}\` has no profile in community ${config.communityname}`)

		let embed = new MessageEmbed()
			.setTitle("FAGC Profile Revocation")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription(`FAGC Profile of player \`${playername}\` in community ${config.communityname}`)
		const fields = await Promise.all(profile.map(async (report, i) => {
			const admin = await this.client.users.fetch(report.adminId)
			return {
				name: report.id,
				value: 	`By: <@${admin.id}> | ${admin.tag}\nBroken rule: ${report.brokenRule}\n` +
						`Proof: ${report.proof}\nDescription: ${report.description}\n` +
						`Automated: ${report.automated}\nViolated time: ${(new Date(report.reportedTime)).toUTCString()}`,
				inline: true
			}
		}))
		createPagedEmbed(fields, embed, message, {maxPageCount: 5})

		const confirm = await getConfirmationMessage(message, "Are you sure you want to revoke this player's profile?")
		if (!confirm)
			return message.channel.send("Profile revocation cancelled")

		try {
			const response = await this.client.fagc.reports.revokeAllName(playername, message.author.id)
			if (response.reports && response.playername && response.communityId) {
				return message.channel.send("Profile revoked!")
			} else {
				return handleErrors(message, response)
			}
		} catch (error) {
			if (error instanceof AuthenticationError) return message.channel.send("Your API key is set incorrectly")
			console.error({ error })
			return message.channel.send("Error removing profile. Please check logs.")
		}
	}
}
module.exports = RevokeAllname