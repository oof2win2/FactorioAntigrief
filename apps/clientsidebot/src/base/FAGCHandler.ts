import FAGCBot from "./fagcbot"
import rcon from "./rcon"

const wait = (time: number): Promise<void> => { 
	return new Promise(resolve => {
		setTimeout(resolve, time)
	})
}

import { client } from "../index"
import { Report, Revocation } from "fagc-api-wrapper"
async function IsWhitelisted(playername: string): Promise<boolean> {
	const res = await client.prisma.whitelist.findFirst({where: {
		playername: playername
	}})
	if (res) return true
	return false

}


export async function PlayerJoin (playername: string, client: FAGCBot): Promise<boolean> {
	const reports = await client.fagc.reports.fetchAllName(playername)
	const revocations = await client.fagc.revocations.fetchAllRevocations(playername)
	if (!reports[0] && !revocations[0]) return false // no violations or revocations at all
	const getPlayerBans = await rcon.rconCommandAll(`/banlist get ${playername}`).then(responses=>responses.map(resp=>resp.resp))
	const isPlayerBanned = getPlayerBans.map(ban=>ban === `${playername} is banned.\n`).some(r=>r)
	let rev: boolean[]
	if (isPlayerBanned) rev = <boolean[]> await Promise.all(revocations.map(revocation => HandleUnfilteredRevocation(revocation, client)))
	else rev = []
	const res = <boolean[]> await Promise.all(reports.map(violation => HandleUnfilteredViolation(violation)))
	return rev.concat(res).filter(v=>v)[0] || false
}

export async function HandleUnfilteredViolation (violation: Report): Promise<boolean> {
	if (!FAGCBot.fagcconfig) {
		await wait(2500)
		return HandleUnfilteredViolation(violation)
	}
	const rule = FAGCBot.fagcconfig.ruleFilters.find(ruleid => ruleid === violation.brokenRule)
	const community = FAGCBot.fagcconfig.trustedCommunities.find(communityId => communityId === violation.communityId)
	if (rule && community) {
		return HandleFilteredViolation(violation)
	}
	return false
}

async function HandleFilteredViolation (report: Report): Promise<boolean> {
	if (await IsWhitelisted(report.playername)) return false
	// player is not whitelisted
	const jailCommand = FAGCBot.config.jailCommand.replace("${PLAYERNAME}", report.playername).replace("${REASON}", `You have a violation on FAGC. Please check ${FAGCBot.config.apiurl}/violations/getall?playername=${report.playername} for why this could be`)
	const banCommand = FAGCBot.config.banCommand.replace("${PLAYERNAME}", report.playername).replace("${REASON}", `You have a violation on FAGC. Please check ${FAGCBot.config.apiurl}/violations/getall?playername=${report.playername} for why this could be`)
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

export async function HandleUnfilteredRevocation (revocation: Revocation, client: FAGCBot): Promise<boolean> {
	if (!FAGCBot.fagcconfig) {
		setTimeout(() => HandleUnfilteredRevocation(revocation, client), 5000)
		return false
	}
	const rule = FAGCBot.fagcconfig.ruleFilters.find(ruleid => ruleid === revocation.brokenRule)
	const community = FAGCBot.fagcconfig.trustedCommunities.find(communityId => communityId === revocation.communityId)
	const allReports = await client.getFilteredReports(revocation.playername)
	if (allReports.length) return false // there is more than one report
	if (rule && community) {
		return HandleFilteredRevocation(revocation)
	}
	return false
}

async function HandleFilteredRevocation (revocation: Revocation): Promise<boolean> {
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
