import fetch from "node-fetch"
import FAGCBot from "./fagcbot"
import rcon from "./rcon"

const wait = (time: number): Promise<void> => { 
	return new Promise(resolve => {
		setTimeout(resolve, time)
	})
}

import { client } from "../index"
async function IsWhitelisted(playername: string): Promise<boolean> {
	const res = await client.prisma.whitelist.findFirst({where: {
		playername: playername
	}})
	if (res) return true
	return false

}


export async function PlayerJoin (playername: string): Promise<boolean> {
	console.log(`${playername} joined the game`)
	const violations = await fetch(`${FAGCBot.config.apiurl}/violations/getall?playername=${playername}`, {
		headers: {"Content-Type": "application/json"}
	}).then(v=>v.json())
	const revocations = await fetch(`${FAGCBot.config.apiurl}/revocations/getallrevocations?playername=${playername}`, {
		headers: { "Content-Type": "application/json" }
	}).then(v => v.json())
	if (!violations[0] && !revocations[0]) return false // no violations or revocations at all
	let rev = <boolean[]> await Promise.all(revocations.map(revocation => HandleUnfilteredRevocation(revocation)))
	let res = <boolean[]> await Promise.all(violations.map(violation => HandleUnfilteredViolation(violation)))
	return rev.concat(res).filter(v=>v)[0] || false
}

export async function HandleUnfilteredViolation (violation): Promise<boolean> {
	console.log(violation)
	if (!FAGCBot.fagcconfig) {
		await wait(2500)
		return HandleUnfilteredViolation(violation)
	}
	const rule = FAGCBot.fagcconfig.ruleFilters.find(ruleid => ruleid === violation.broken_rule)
	const community = FAGCBot.fagcconfig.trustedCommunities.find(communityid => communityid === violation.communityid)
	console.log(rule, community)
	if (rule && community) {
		return HandleFilteredViolation(violation)
	}
	return false
}

async function HandleFilteredViolation (violation): Promise<boolean> {
	if (await IsWhitelisted(violation.playername)) return false
	// player is not whitelisted
	const jailCommand = FAGCBot.config.jailCommand.replace("${PLAYERNAME}", violation.playername).replace("${REASON}", `You have a violation on FAGC. Please check ${FAGCBot.config.apiurl}/violations/getall?playername=${violation.palyername} for why this could be`)
	const banCommand = FAGCBot.config.banCommand.replace("${PLAYERNAME}", violation.playername).replace("${REASON}", `You have a violation on FAGC. Please check ${FAGCBot.config.apiurl}/violations/getall?playername=${violation.palyername} for why this could be`)
	switch (FAGCBot.GuildConfig.onViolation) {
		case "info": return false
		case "jail": 
			rcon.rconCommandAll(jailCommand)
			return true
		case "ban":
			rcon.rconCommandAll(banCommand)
			return true
		default: return false
	}
}

export async function HandleUnfilteredRevocation (revocation): Promise<boolean> {
	if (!FAGCBot.fagcconfig) {
		await wait(5000)
		return HandleUnfilteredRevocation(revocation)
	}
	const rule = FAGCBot.fagcconfig.ruleFilters.find(ruleid => ruleid === revocation.broken_rule)
	const community = FAGCBot.fagcconfig.trustedCommunities.find(communityid => communityid === revocation.communityid)
	if (rule && community) {
		return HandleFilteredRevocation(revocation)
	}
	return false
}

async function HandleFilteredRevocation (revocation): Promise<boolean> {
	const unjailCommand = FAGCBot.config.unjailCommand.replace("${PLAYERNAME}", revocation.playername)
	const unbanCommand = FAGCBot.config.unbanCommand.replace("${PLAYERNAME}", revocation.playername)
	switch (FAGCBot.GuildConfig.onRevocation) {
		case "info": return false
		case "keepBanned": return false
		case "removeBan":
			rcon.rconCommandAll(unbanCommand)
			rcon.rconCommandAll(unjailCommand)
			return true
		default: return false
	}
}
