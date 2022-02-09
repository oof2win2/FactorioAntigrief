import { WebhookClient, MessageEmbed } from "discord.js"
import WebhookSchema from "../database/webhook"
import WebSocket from "ws"
import GuildConfigModel, {
	GuildConfigClass,
} from "../database/guildconfig"
import { DocumentType, mongoose } from "@typegoose/typegoose"
import { BeAnObject } from "@typegoose/typegoose/lib/types"
import { CategoryClass } from "../database/category"
import { CommunityClass } from "../database/community"
import { ReportInfoClass } from "../database/reportinfo"
import {
	Category,
	CommunityCreatedMessageExtraOpts,
	ReportMessageExtraOpts,
	Revocation,
	RevocationMessageExtraOpts,
} from "fagc-api-types"

const WebhookGuildIds = new WeakMap<WebSocket, string[]>()

let WebhookQueue: MessageEmbed[] = []

async function SendWebhookMessages() {
	// mongoose isn't connected so no point in sending webhooks, as it will error
	if (mongoose.connection.readyState !== 1) return
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
setInterval(SendWebhookMessages, 5000).unref()

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
		if (typeof message.type === "string" && typeof message.guildId === "string") {
			if (message.type === "addGuildId") {
				const guildConfig = await GuildConfigModel.findOne({
					guildId: message.guildId,
				}).then((c) => c?.toObject())
				if (guildConfig) {
					this.ws.send(
						JSON.stringify({
							config: guildConfig,
							messageType: "guildConfigChanged",
						})
					)


					// add guildId to webhook only if the guild id has an existing config
					const existing = WebhookGuildIds.get(this.ws)
					if (existing) {
						// limit to 25 guilds per webhook
						if (existing.length < 25) {
							// only add if it's not already in the list
							if (!existing.includes(message.guildId)) existing.push(message.guildId)
						}
						WebhookGuildIds.set(this.ws, existing)
					} else {
						WebhookGuildIds.set(this.ws, [ message.guildId ])
					}
				}
			}
			if (message.type === "removeGuildId") {
				const existing = WebhookGuildIds.get(this.ws)
				if (existing)
					WebhookGuildIds.set(this.ws, existing.filter(id => id !== message.guildId))
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
}, 30 * 1000).unref()

export function WebsocketMessage(message: string): void {
	wsClients.forEach((client) => {
		if (client.ws.readyState === WebSocket.OPEN) {
			client.ws.send(message)
		}
	})
}

export async function reportCreatedMessage(
	report: DocumentType<ReportInfoClass, BeAnObject>,
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
				name: "Category",
				value: `${opts.category.name} (\`${opts.category.id}\`)`,
				inline: true,
			},
			{ name: "Description", value: report.description, inline: false },
			{
				name: "Admin",
				value: `<@${opts.createdBy.id}> | ${opts.createdBy.username}#${opts.createdBy.discriminator}`,
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
	revocation: Revocation,
	opts: RevocationMessageExtraOpts
): Promise<void> {
	if (revocation === null || revocation.playername === undefined) return

	// set the sent object's messageType to revocation
	// WebsocketMessage(JSON.stringify(Object.assign({}, revocation.toObject(), { messageType: "revocation" })))

	const revocationEmbed = new MessageEmbed()
		.setTitle("FAGC - Report Revoked")
		.setDescription(
			`${revocation.automated ? "Automated " : ""}Report \`${
				revocation.id
			}\` revoked with \`${revocation.id}\` at <t:${Math.round(
				revocation.revokedAt.valueOf() / 1000
			)}>\n` +
				`${opts.totalReports} reports in ${opts.totalCommunities} communities`
		)
		.setColor("#0eadf1")
		.addFields([
			{ name: "Playername", value: revocation.playername, inline: true },
			{
				name: "Category",
				value: `${opts.category.name} (\`${opts.category.id}\`)`,
				inline: true,
			},
			{
				name: "Description",
				value: revocation.description,
				inline: false,
			},
			{
				name: "Admin",
				value: `<@${opts.revokedBy.id}> | ${opts.revokedBy.username}#${opts.revokedBy.discriminator}`,
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

export async function categoryCreatedMessage(
	category: DocumentType<CategoryClass, BeAnObject>
): Promise<void> {
	if (
		category === null ||
		category.name === undefined ||
		category.description === undefined
	)
		return

	// set the sent object's messageType to categoryCreated
	// WebsocketMessage(JSON.stringify(Object.assign({}, category.toObject(), { messageType: "categoryCreated" })))

	const categoryEmbed = new MessageEmbed()
		.setTitle("FAGC - Category Created")
		.setColor("#6f4fe3")
		.addFields(
			{ name: "Category ID", value: `\`${category.id}\``, inline: true },
			{
				name: "Category name",
				value: category.name,
				inline: true,
			},
			{
				name: "Category description",
				value: category.description,
				inline: true,
			}
		)
	WebhookMessage(categoryEmbed)

	WebsocketMessage(
		JSON.stringify({
			messageType: "categoryCreated",
			embed: categoryEmbed,
			category: category,
		})
	)
}

export async function categoryRemovedMessage(
	category: DocumentType<CategoryClass, BeAnObject>
): Promise<void> {
	if (
		category === null ||
		category.name === undefined ||
		category.description === undefined
	)
		return
	// set the sent object's messageType to categoryRemoved
	// WebsocketMessage(JSON.stringify(Object.assign({}, category.toObject(), { messageType: "categoryRemoved" })))

	const categoryEmbed = new MessageEmbed()
		.setTitle("FAGC - Category Removed")
		.setColor("#6f4fe3")
		.addFields(
			{ name: "Category ID", value: `\`${category.id}\``, inline: true },
			{
				name: "Category name",
				value: category.name,
				inline: true,
			},
			{
				name: "Category description",
				value: category.description,
				inline: true,
			}
		)
	WebhookMessage(categoryEmbed)

	WebsocketMessage(
		JSON.stringify({
			messageType: "categoryRemoved",
			embed: categoryEmbed,
			category: category,
		})
	)
}

export async function categoryUpdatedMessage(
	oldCategory: Category,
	newCategory: Category
): Promise<void> {
	const categoryEmbed = new MessageEmbed()
		.setTitle("FAGC - Category Updated")
		.setColor("#6f4fe3")
		.addFields(
			{ name: "Category ID", value: `\`${newCategory.id}\``, inline: true },
			{
				name: "Old Category name",
				value: oldCategory.name,
				inline: true,
			},
			{
				name: "New Category name",
				value: newCategory.name,
				inline: true,
			},
			{
				name: "Old Category description",
				value: oldCategory.description,
				inline: true,
			},
			{
				name: "New Category description",
				value: newCategory.description,
				inline: true,
			}
		)
	WebhookMessage(categoryEmbed)

	WebsocketMessage(
		JSON.stringify({
			messageType: "categoryUpdated",
			embed: categoryEmbed,
			oldCategory: oldCategory,
			newCategory: newCategory
		})
	)
}
export async function categoriesMergedMessage(
	receiving: DocumentType<CategoryClass, BeAnObject>,
	dissolving: DocumentType<CategoryClass, BeAnObject>
): Promise<void> {
	const categoryEmbed = new MessageEmbed()
		.setTitle("FAGC - Categories merged")
		.setColor("#6f4fe3")
		.addFields(
			{ name: "Receiving Category ID", value: `\`${dissolving.id}\``, inline: true },
			{
				name: "Dissolving Category name",
				value: receiving.name,
				inline: true,
			},
			{
				name: "Receiving Category name",
				value: dissolving.name,
				inline: true,
			},
			{
				name: "Dissolving Category description",
				value: receiving.description,
				inline: true,
			},
			{
				name: "Receiving Category description",
				value: dissolving.description,
				inline: true,
			}
		)
	WebhookMessage(categoryEmbed)

	WebsocketMessage(
		JSON.stringify({
			messageType: "categoriesMerged",
			embed: categoryEmbed,
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
				value: `<@${opts.createdBy.id}> | ${opts.createdBy.username}#${opts.createdBy.discriminator}`,
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
				value: `<@${opts.createdBy.id}> | ${opts.createdBy.username}#${opts.createdBy.discriminator}`,
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
				value: `<@${opts.createdBy.id}> | ${opts.createdBy.username}#${opts.createdBy.discriminator}`,
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
				value: `<@${opts.createdBy.id}> | ${opts.createdBy.username}#${opts.createdBy.discriminator}`,
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
		const guildIds = WebhookGuildIds.get(client.ws)
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
