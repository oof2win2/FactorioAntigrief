import { WebhookClient, MessageEmbed } from "discord.js"
import WebhookSchema from "../database/fagc/webhook.js"
import WebSocket from "ws"
import GuildConfigModel, {
	GuildConfigClass,
} from "../database/fagc/guildconfig.js"
import { RevocationClass } from "../database/fagc/revocation.js"
import { DocumentType } from "@typegoose/typegoose"
import { BeAnObject } from "@typegoose/typegoose/lib/types"
import { RuleClass } from "../database/fagc/rule.js"
import { CommunityClass } from "../database/fagc/community.js"
import { ReportClass } from "../database/fagc/report.js"
import {
	CommunityCreatedMessageExtraOpts,
	ReportMessageExtraOpts,
	RevocationMessageExtraOpts,
} from "fagc-api-types"

const WebhookGuildIDs = new WeakMap<WebSocket, string[]>()

let WebhookQueue: MessageEmbed[] = []

async function SendWebhookMessages() {
	const embeds = WebhookQueue.slice(0, 10)
	if (!embeds[0]) return
	WebhookQueue = WebhookQueue.slice(10)
	const webhooks = await WebhookSchema.find()
	webhooks.forEach(async (webhook) => {
		const client = new WebhookClient({
			id: webhook.id,
			token: webhook.token,
		})
		client
			.send({ embeds: embeds, username: "FAGC Notifier" })
			.catch((error) => {
				if (error.stack.includes("Unknown Webhook")) {
					console.log(
						`Unknown webhook ${webhook.id} with token ${webhook.token}. GID ${webhook.guildId}. Removing webhook from database.`
					)
					WebhookSchema.findByIdAndDelete(webhook._id).exec()
				} else throw error
			})
	})
}
setInterval(SendWebhookMessages, 5000)

export function WebhookMessage(message: MessageEmbed): void {
	WebhookQueue.push(message)
}

export const wsClients = new Set<WsClient>()
export class WsClient {
	constructor(public ws: WebSocket) {
		wsClients.add(this)
		ws.on("ping", () => {
			// comply with the IETF standard of replying to ping with pong
			ws.pong()
		})
		ws.on("message", (data) => {
			let message: { type: string } | Array<unknown> | string | number | boolean | null
			try {
				message = JSON.parse(data.toString("utf8"))
			} catch {
				// if an error with parsing occurs, it's their problem
				return
			}
			if (
				typeof message === "object"
				&& message !== null
				&& !(message instanceof Array)
				&& typeof message.type === "string"
			) {
				this.handleMessage(message as { type: string }).catch(console.error)
			}
		})
		ws.on("close", (code, reason) => {
			void code, reason
			wsClients.delete(this)
		})
	}

	async handleMessage(message: { type: string, [index: string]: unknown }) {
		if (typeof message.type === "string" && typeof message.guildID === "string") {
			if (message.type === "addGuildID") {
				const guildConfig = await GuildConfigModel.findOne({
					guildId: message.guildID,
				}).then((c) => c?.toObject())
				if (guildConfig) {
					this.ws.send(
						JSON.stringify({
							config: guildConfig,
							messageType: "guildConfigChanged",
						})
					)


					// add guildID to webhook only if the guild id has an existing config
					const existing = WebhookGuildIDs.get(this.ws)
					if (existing) {
						// limit to 25 guilds per webhook
						if (existing.length < 25) {
							// only add if it's not already in the list
							if (!existing.includes(message.guildID)) existing.push(message.guildID)
						}
						WebhookGuildIDs.set(this.ws, existing)
					} else {
						WebhookGuildIDs.set(this.ws, [ message.guildID ])
					}
				}
			}
			if (message.type === "removeGuildID") {
				const existing = WebhookGuildIDs.get(this.ws)
				if (existing)
					WebhookGuildIDs.set(this.ws, existing.filter(id => id !== message.guildID))
			}
		}
	}
}

setInterval(() => {
	wsClients.forEach((client) => {
		// ping the client
		console.log("ping")
		client.ws.ping()
	})
}, 30 * 1000)

export function WebsocketMessage(message: string): void {
	wsClients.forEach((client) => {
		if (client.ws.readyState === WebSocket.OPEN) {
			client.ws.send(message)
		}
	})
}

export async function reportCreatedMessage(
	report: DocumentType<ReportClass, BeAnObject>,
	opts: ReportMessageExtraOpts
): Promise<void> {
	if (report === null || report.playername === undefined) return

	// set the sent object's messageType to report
	// WebsocketMessage(JSON.stringify(Object.assign({}, report.toObject(), { messageType: "report" })))

	const reportEmbed = new MessageEmbed()
		.setTitle("FAGC - Report Created")
		.setDescription(
			`${report.automated ? "Automated " : ""}Report \`${
				report.id
			}\` created at <t:${Math.round(
				report.reportedTime.valueOf() / 1000
			)}>\n` +
				`${opts.totalReports} reports in ${opts.totalCommunities} communities`
		)
		.setColor("ORANGE")
		.addFields(
			{ name: "Playername", value: report.playername, inline: true },
			{
				name: "Broken Rule",
				value: `${opts.rule.shortdesc} (\`${opts.rule.id}\`)`,
				inline: true,
			},
			{ name: "Description", value: report.description, inline: false },
			{
				name: "Admin",
				value: `<@${opts.admin.id}> | ${opts.admin.username}#${opts.admin.discriminator}`,
				inline: true,
			},
			{
				name: "Community",
				value: `${opts.community.name} (\`${opts.community.id}\`)`,
				inline: true,
			}
		)
		.setTimestamp()
	if (report.proof !== "No Proof")
		reportEmbed.addField("Proof", report.proof, false)
	WebhookMessage(reportEmbed)

	WebsocketMessage(
		JSON.stringify({
			embed: reportEmbed,
			report: report,
			extraData: opts,
			messageType: "report",
		})
	)
}

export async function reportRevokedMessage(
	revocation: DocumentType<RevocationClass, BeAnObject>,
	opts: RevocationMessageExtraOpts
): Promise<void> {
	if (revocation === null || revocation.playername === undefined) return

	// set the sent object's messageType to revocation
	// WebsocketMessage(JSON.stringify(Object.assign({}, revocation.toObject(), { messageType: "revocation" })))

	const revocationEmbed = new MessageEmbed()
		.setTitle("FAGC - Report Revoked")
		.setDescription(
			`${revocation.automated ? "Automated " : ""}Report \`${
				revocation.reportId
			}\` revoked with \`${revocation.id}\` at <t:${Math.round(
				revocation.revokedTime.valueOf() / 1000
			)}>\n` +
				`${opts.totalReports} reports in ${opts.totalCommunities} communities`
		)
		.setColor("#0eadf1")
		.addFields([
			{ name: "Playername", value: revocation.playername, inline: true },
			{
				name: "Broken Rule",
				value: `${opts.rule.shortdesc} (\`${opts.rule.id}\`)`,
				inline: true,
			},
			{
				name: "Description",
				value: revocation.description,
				inline: false,
			},
			{
				name: "Admin",
				value: `<@${opts.admin.id}> | ${opts.admin.username}#${opts.admin.discriminator}`,
				inline: true,
			},
			{
				name: "Community",
				value: `${opts.community.name} (\`${opts.community.id}\`)`,
				inline: true,
			},
			{
				name: "Revoked by",
				value: `<@${opts.revokedBy.id}> | ${opts.revokedBy.username}#${opts.revokedBy.discriminator}`,
				inline: true,
			},
		])
		.setTimestamp()
	if (revocation.proof !== "No Proof")
		revocationEmbed.addField("Proof", revocation.proof, false)
	WebhookMessage(revocationEmbed)

	WebsocketMessage(
		JSON.stringify({
			embed: revocationEmbed,
			revocation: revocation,
			extraData: opts,
			messageType: "revocation",
		})
	)
}

export async function ruleCreatedMessage(
	rule: DocumentType<RuleClass, BeAnObject>
): Promise<void> {
	if (
		rule === null ||
		rule.shortdesc === undefined ||
		rule.longdesc === undefined
	)
		return

	// set the sent object's messageType to ruleCreated
	// WebsocketMessage(JSON.stringify(Object.assign({}, rule.toObject(), { messageType: "ruleCreated" })))

	const ruleEmbed = new MessageEmbed()
		.setTitle("FAGC - Rule Created")
		.setColor("#6f4fe3")
		.addFields(
			{ name: "Rule ID", value: `\`${rule.id}\``, inline: true },
			{
				name: "Rule short description",
				value: rule.shortdesc,
				inline: true,
			},
			{
				name: "Rule long description",
				value: rule.longdesc,
				inline: true,
			}
		)
	WebhookMessage(ruleEmbed)

	WebsocketMessage(
		JSON.stringify({
			messageType: "ruleCreated",
			embed: ruleEmbed,
			rule: rule,
		})
	)
}

export async function ruleRemovedMessage(
	rule: DocumentType<RuleClass, BeAnObject>
): Promise<void> {
	if (
		rule === null ||
		rule.shortdesc === undefined ||
		rule.longdesc === undefined
	)
		return
	// set the sent object's messageType to ruleRemoved
	// WebsocketMessage(JSON.stringify(Object.assign({}, rule.toObject(), { messageType: "ruleRemoved" })))

	const ruleEmbed = new MessageEmbed()
		.setTitle("FAGC - Rule Removed")
		.setColor("#6f4fe3")
		.addFields(
			{ name: "Rule ID", value: `\`${rule.id}\``, inline: true },
			{
				name: "Rule short description",
				value: rule.shortdesc,
				inline: true,
			},
			{
				name: "Rule long description",
				value: rule.longdesc,
				inline: true,
			}
		)
	WebhookMessage(ruleEmbed)

	WebsocketMessage(
		JSON.stringify({
			messageType: "ruleRemoved",
			embed: ruleEmbed,
			rule: rule,
		})
	)
}

export async function ruleUpdatedMessage(
	oldRule: DocumentType<RuleClass, BeAnObject>,
	newRule: DocumentType<RuleClass, BeAnObject>
): Promise<void> {
	const ruleEmbed = new MessageEmbed()
		.setTitle("FAGC - Rule Updated")
		.setColor("#6f4fe3")
		.addFields(
			{ name: "Rule ID", value: `\`${newRule.id}\``, inline: true },
			{
				name: "Old Rule short description",
				value: oldRule.shortdesc,
				inline: true,
			},
			{
				name: "New Rule short description",
				value: newRule.shortdesc,
				inline: true,
			},
			{
				name: "Old Rule long description",
				value: oldRule.longdesc,
				inline: true,
			},
			{
				name: "New Rule long description",
				value: newRule.longdesc,
				inline: true,
			}
		)
	WebhookMessage(ruleEmbed)

	WebsocketMessage(
		JSON.stringify({
			messageType: "ruleUpdated",
			embed: ruleEmbed,
			oldRule: oldRule,
			newRule: newRule
		})
	)
}
export async function rulesMergedMessage(
	receiving: DocumentType<RuleClass, BeAnObject>,
	dissolving: DocumentType<RuleClass, BeAnObject>
): Promise<void> {
	const ruleEmbed = new MessageEmbed()
		.setTitle("FAGC - Rules merged")
		.setColor("#6f4fe3")
		.addFields(
			{ name: "Receiving Rule ID", value: `\`${dissolving.id}\``, inline: true },
			{
				name: "Dissolving Rule short description",
				value: receiving.shortdesc,
				inline: true,
			},
			{
				name: "Receiving Rule short description",
				value: dissolving.shortdesc,
				inline: true,
			},
			{
				name: "Dissolving Rule long description",
				value: receiving.longdesc,
				inline: true,
			},
			{
				name: "Receiving Rule long description",
				value: dissolving.longdesc,
				inline: true,
			}
		)
	WebhookMessage(ruleEmbed)

	WebsocketMessage(
		JSON.stringify({
			messageType: "rulesMerged",
			embed: ruleEmbed,
			receiving: receiving,
			dissolving: dissolving
		})
	)
}

export async function communityCreatedMessage(
	community: DocumentType<CommunityClass, BeAnObject>,
	opts: CommunityCreatedMessageExtraOpts
): Promise<void> {
	// set the sent object's messageType to communityCreated
	// WebsocketMessage(JSON.stringify(Object.assign({}, community.toObject(), { messageType: "communityCreated" })))

	const embed = new MessageEmbed()
		.setTitle("FAGC - Community Created")
		.setColor("#6f4fe3")
		.addFields(
			{
				name: "Community ID",
				value: `\`${community.id}\``,
				inline: true,
			},
			{ name: "Community name", value: community.name, inline: true },
			{
				name: "Contact",
				value: `<@${opts.contact.id}> | ${opts.contact.username}#${opts.contact.discriminator}`,
				inline: true,
			}
		)
	WebhookMessage(embed)

	WebsocketMessage(
		JSON.stringify({
			messageType: "communityCreated",
			embed: embed,
			community: community,
			extraData: opts,
		})
	)
}
export async function communityRemovedMessage(
	community: DocumentType<CommunityClass, BeAnObject>,
	opts: CommunityCreatedMessageExtraOpts
): Promise<void> {
	// set the sent object's messageType to communityRemoved
	// WebsocketMessage(JSON.stringify(Object.assign({}, community.toObject(), { messageType: "communityRemoved" })))

	const embed = new MessageEmbed()
		.setTitle("FAGC - Community Removed")
		.setColor("#6f4fe3")
		.addFields(
			{
				name: "Community ID",
				value: `\`${community.id}\``,
				inline: true,
			},
			{ name: "Community name", value: community.name, inline: true },
			{
				name: "Contact",
				value: `<@${opts.contact.id}> | ${opts.contact.username}#${opts.contact.discriminator}`,
				inline: true,
			}
		)
	WebhookMessage(embed)

	WebsocketMessage(
		JSON.stringify({
			messageType: "communityCreated",
			embed: embed,
			community: community,
			extraData: opts,
		})
	)
}

export async function communityUpdatedMessage(
	community: DocumentType<CommunityClass, BeAnObject>,
	opts: CommunityCreatedMessageExtraOpts
): Promise<void> {
	const embed = new MessageEmbed()
		.setTitle("FAGC - Community Updated")
		.setColor("#6f4fe3")
		.addFields(
			{
				name: "Community ID",
				value: `\`${community.id}\``,
				inline: true,
			},
			{ name: "Community name", value: community.name, inline: true },
			{
				name: "Contact",
				value: `<@${opts.contact.id}> | ${opts.contact.username}#${opts.contact.discriminator}`,
				inline: true,
			}
		)
	WebhookMessage(embed)

	WebsocketMessage(
		JSON.stringify({
			messageType: "communityUpdated",
			embed: embed,
			community: community,
			extraData: opts,
		})
	)
}

export async function communitiesMergedMessage(
	receiving: DocumentType<CommunityClass, BeAnObject>,
	dissolving: DocumentType<CommunityClass, BeAnObject>,
	opts: CommunityCreatedMessageExtraOpts
): Promise<void> {
	const embed = new MessageEmbed()
		.setTitle("FAGC - Communities Updated")
		.setColor("#6f4fe3")
		.addFields(
			{
				name: "Receiving Community ID",
				value: `\`${receiving.id}\``,
				inline: true,
			},
			{ name: "Receiving Community name", value: receiving.name, inline: true },
			{
				name: "Receiving Community Contact",
				value: `<@${opts.contact.id}> | ${opts.contact.username}#${opts.contact.discriminator}`,
				inline: true,
			},
			{
				name: "Dissolving Community ID",
				value: `\`${dissolving.id}\``,
				inline: true
			},
			{ name: "Dissolving Community name", value: dissolving.name, inline: true },
		)
	WebhookMessage(embed)

	WebsocketMessage(
		JSON.stringify({
			messageType: "communitiesMerged",
			embed: embed,
			receiving: receiving,
			dissolving: dissolving,
			extraData: opts,
		})
	)
}

export function guildConfigChanged(
	config: DocumentType<GuildConfigClass, BeAnObject>
): void {
	wsClients.forEach((client) => {
		const guildIds = WebhookGuildIDs.get(client.ws)
		if (guildIds?.includes(config.guildId)) {
			client.ws.send(
				JSON.stringify({
					config: config,
					messageType: "guildConfigChanged",
				})
			)
		}
	})
}
