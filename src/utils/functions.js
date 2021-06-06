const AuthSchema = require("../database/fagc/authentication")
const CommunitySchema = require("../database/fagc/community")
const fetch = require("node-fetch")
const config = require("../../config")

module.exports = {
	getCommunity,
	checkUser,
	sendEmbed,
	sendEmbedWait,
}

async function getCommunity(api_key) {
	const auth = await AuthSchema.findOne({ api_key: api_key })
	return CommunitySchema.findById(auth.communityid)
}
async function checkUser(userid) {
	const user = await fetch(`https://discord.com/api/users/${userid}`, {
		headers: {
			"Content-type": "application/json",
			"Authorization": `Bot ${config.botToken}`
		}
	}).then((r) => r.json())
	if (!user || !user.id) return false
	return true
}
// sends an embed without checking if it was delivered etc. jus returns based on status code
async function sendEmbed(webhookid, webhooktoken, content) {
	const res = await fetch(`https://discord.com/api/webhooks/${webhookid}/${webhooktoken}`, {
		method: "POST",
		body: JSON.stringify(content),
		headers: { "Content-type": "application/json", }
	})
	if (res.ok) return true
	return false
}
// sends an embed and waits for the sending to finish. returns a Discord message
async function sendEmbedWait(webhookid, webhooktoken, content) {
	try {
		const resRaw = await fetch(`https://discord.com/api/webhooks/${webhookid}/${webhooktoken}?wait=true`, {
			method: "POST",
			body: JSON.stringify(content),
			headers: { "Content-type": "application/json",}
		})
		if (!resRaw.ok) throw "not ok"
		return resRaw.json()
	} catch {
		return false
	}
}