// const { MessageEmbed } = require("discord.js")
// const { handleErrors, createPagedEmbed } = require("../../utils/functions")
// const { getConfirmationMessage, getMessageResponse } = require("../../utils/responseGetter")
// const Command = require("../../base/Command")
// const { AuthenticationError } = require("fagc-api-wrapper")

import { EmbedField, MessageEmbed } from "discord.js";
import { Command } from "../../base/Command";
import { createPagedEmbed } from "../../utils/functions";
import { getConfirmationMessage, getMessageResponse } from "../../utils/responseGetter";

// class RevokeAllname extends Command {
// 	constructor(client) {
// 		super(client, {
// 			name: "revokeallname",
// 			description:
// 				"Revokes your profile of a player by profile ID (revoke all reports of a player by playername)",
// 			aliases: [ "revokeprofile" ],
// 			category: "reports",
// 			usage: "[playername]",
// 			examples: [ "{{p}}revokeallname Windsinger" ],
// 			dirname: __dirname,
// 			enabled: true,
// 			memberPermissions: [ "BAN_MEMBERS" ],
// 			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
// 			ownerOnly: false,
// 			cooldown: 3000,
// 			requiredConfig: true,
// 			customPermissions: [ "reports" ],
// 		})
// 	}
// 	async run(message, args, config) {
// 		if (!config.apikey) return message.reply(`${this.client.emotes.warn} No API key set`)

// 		if (!args[0])
// 			args = await getMessageResponse(message, `${this.client.emotes.type} Provide a player name to revoke reports of`)
// 				.then((r) => r?.content)
// 		const playername = args.shift()
// 		if (!playername) return message.channel.send(`${this.client.emotes.warn} No player name was provided`)

// 		const profile = await this.client.fagc.profiles.fetchCommunity({
// 			playername: playername,
// 			communityId: config.communityId
// 		})
// 		if (!profile || !profile.reports[0])
// 			return message.reply(
// 				`Player \`${playername}\` has no profile in your community`
// 			)

// 		let embed = new MessageEmbed()
// 			.setTitle("FAGC Profile Revocation")
// 			.setColor("GREEN")
// 			.setTimestamp()
// 			.setAuthor("FAGC Community")
// 			.setDescription(
// 				`FAGC Profile of player \`${playername}\` in community ${config.communityId}`
// 			)
// 		const fields = await Promise.all(
// 			profile.reports.map(async (report) => {
// 				const admin = await this.client.users.fetch(report.adminId)
// 				return {
// 					name: report.id,
// 					value:
// 						`By: <@${admin.id}> | ${admin.tag}\nBroken rule: ${report.brokenRule}\n` +
// 						`Proof: ${report.proof}\nDescription: ${report.description}\n` +
// 						`Automated: ${report.automated
// 						}\nViolated time: <t:${Math.round(report.reportedTime/1000)}>`,
// 					inline: true,
// 				}
// 			})
// 		)
// 		createPagedEmbed(fields, embed, message, { maxPageCount: 5 })

// 		const confirm = await getConfirmationMessage(
// 			message,
// 			"Are you sure you want to revoke this player's profile?"
// 		)
// 		if (!confirm)
// 			return message.channel.send("Profile revocation cancelled")

// 		try {
// 			const response = await this.client.fagc.reports.revokeAllName({
// 				playername: playername,
// 				adminId: message.author.id,
// 				reqConfig: {
// 					apikey: config.apikey,
// 				}
// 			})
// 			if (response.length) {
// 				return message.channel.send("Profile revoked!")
// 			} else {
// 				return handleErrors(message, response)
// 			}
// 		} catch (error) {
// 			if (error instanceof AuthenticationError)
// 				return message.channel.send("Your API key is set incorrectly")
// 			console.error({ error })
// 			return message.channel.send(
// 				"Error removing profile. Please check logs."
// 			)
// 		}
// 	}
// }
// module.exports = RevokeAllname


const RevokeAllName: Command = {
	name: "revokeallname",
	description: "Revokes all reports of a player in your community",
	aliases: [],
	category: "reports",
	usage: "[playername]",
	examples: ["revokeallname", "revokeallname Potato"],
	requiresRoles: true,
	requiredPermissions: ["reports"],
	requiresApikey: true,
	async run({client, message, args, guildConfig}) {
		if (!guildConfig.apiKey) return message.reply(`${client.emotes.warn} No API key set`)

		// get playername
		const playername = args.shift() || await getMessageResponse(message, `${client.emotes.type} Provide a player name to revoke reports of`)
			.then((r) => r?.content)
		if (!playername) return message.channel.send(`${client.emotes.warn} No player name was provided`)

		// get all their reports and display them on an embed
		const reports = await client.fagc.reports.search({
			playername: playername,
			communityId: guildConfig.communityId,
		})

		const embed = new MessageEmbed()
			.setTitle("FAGC Report Revocation")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor({name: client.config.embeds.author})
			.setFooter({text: client.config.embeds.footer})
			.setDescription(`FAGC Reports of player \`${playername}\``)
		const fields: EmbedField[] = await Promise.all(
			reports.map(async (report) => {
				const admin = await client.users.fetch(report.adminId).catch(() => null)
					return {
						name: report.id,
						value:
							`By: <@${report.adminId}> | ${admin?.tag}\nCommunity ID: ${report.communityId}\n` +
							`Broken rule: ${report.brokenRule}\nProof: ${report.proof}\n` +
							`Description: ${report.description}\nAutomated: ${report.automated}\n` +
							`Reported at: <t:${Math.round(report.reportedTime.valueOf() / 1000)}>\n` +
							`Report created at: <t:${Math.round(report.reportCreatedAt.valueOf() / 1000)}>`,
						inline: true,
					}
			})
		)
		createPagedEmbed(fields, embed, message, { maxPageCount: 5 })
		const confirm = await getConfirmationMessage(message, `Are you sure you want to revoke all reports of this player?`)
		if (!confirm) return message.channel.send(`Report revocation cancelled`)

		try {
			const response = await client.fagc.revocations.revokePlayer({
				playername: playername,
				adminId: message.author.id,
				reqConfig: {
					apikey: guildConfig.apiKey,
				}
			})
			return message.channel.send(`Reports revoked!`)
		} catch (error) {
			// TODO: check if error is wrong api key
			throw error
		}
	}
}

export default RevokeAllName