import AuthSchema from "../database/fagc/authentication"
import CommunitySchema from "../database/fagc/community"
import fetch from "node-fetch"
import discord from "./discord"

export async function getCommunity(api_key: string | undefined) {
	const auth = await AuthSchema.findOne({ api_key: api_key })
	if (!auth) return null
	return CommunitySchema.findById(auth.communityId)
}
export async function checkUser(userid: string) {
	const user = await discord.users.fetch(userid)
	if (!user || !user.id) return false
	return true
}

/**
 * sends an embed without checking if it was delivered etc. jus returns based on status code
 * @deprecated Deprecated because it does not re-send after rate limits
 */
export async function sendEmbed(webhookid: string, webhooktoken: string, content: any) {
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
export async function sendEmbedWait(webhookid, webhooktoken, content) {
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