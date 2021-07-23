import AuthModel from "../database/fagc/authentication"
import CommunitySchema, {CommunityClass} from "../database/fagc/community"
import fetch from "node-fetch"
import discord from "./discord"
import { BeAnObject, DocumentType } from "@typegoose/typegoose/lib/types"

export async function getCommunity(api_key: string | undefined): Promise<DocumentType<CommunityClass, BeAnObject> | null> {
	const auth = await AuthModel.findOne({ api_key: api_key })
	if (!auth) return null
	return CommunitySchema.findById(auth.communityId).exec()
}
export async function checkUser(userid: string): Promise<boolean> {
	const user = await discord.users.fetch(userid)
	if (!user || !user.id) return false
	return true
}

/**
 * sends an embed without checking if it was delivered etc. jus returns based on status code
 * @deprecated Deprecated because it does not re-send after rate limits
 */
export async function sendEmbed(webhookid: string, webhooktoken: string, content: any): Promise<boolean> {
	const res = await fetch(`https://discord.com/api/webhooks/${webhookid}/${webhooktoken}`, {
		method: "POST",
		body: JSON.stringify(content),
		headers: { "Content-type": "application/json", }
	})
	if (res.ok) return true
	return false
}

/**
 * sends an embed and waits for the sending to finish. returns a Discord message
 * @deprecated Deprecated because it does not re-send after rate limits
 */
export async function sendEmbedWait(webhookid, webhooktoken, content): Promise<boolean> {
	try {
		const resRaw = await fetch(`https://discord.com/api/webhooks/${webhookid}/${webhooktoken}?wait=true`, {
			method: "POST",
			body: JSON.stringify(content),
			headers: { "Content-type": "application/json", }
		})
		if (!resRaw.ok) throw "not ok"
		return resRaw.json()
	} catch {
		return false
	}
}