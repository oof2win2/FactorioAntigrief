import FAGCBot from "./fagcbot.js"
import rcon from "./rcon.js"

const wait = (time: number): Promise<void> => { 
	return new Promise(resolve => {
		setTimeout(resolve, time)
	})
}

import { Report, Revocation } from "fagc-api-types"
async function IsWhitelisted(playername: string, client: FAGCBot): Promise<boolean> {
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
	const res = <boolean[]> await Promise.all(reports.map(violation => HandleUnfilteredViolation(violation, client)))
	return rev.concat(res).filter(v=>v)[0] || false
}

export async function HandleUnfilteredViolation (violation: Report, client: FAGCBot, overrideHandled = false): Promise<boolean> {
	if (!FAGCBot.fagcconfig) {
		await wait(2500)
		return HandleUnfilteredViolation(violation, client)
	}
	const rule = FAGCBot.fagcconfig.ruleFilters.find(ruleid => ruleid === violation.brokenRule)
	if (!rule) return false

	const community = FAGCBot.fagcconfig.trustedCommunities.find(communityId => communityId === violation.communityId)
	if (!community) return false

	const alreadyHandled = await client.prisma.handledReports.findFirst({where: {
		reportId: violation.id
	}})
	if (alreadyHandled && !overrideHandled) return false
	
	return HandleFilteredViolation(violation, client)
}

async function HandleFilteredViolation (report: Report, client: FAGCBot): Promise<boolean> {
	if (await IsWhitelisted(report.playername, client)) return false
	// player is not whitelisted

	// if they are banned then don't do anything
	if (await client.prisma.handledReports.findFirst({where: {playername: report.playername}})) return false

	// create a database entry for future reference
	await client.prisma.handledReports.create({data: {
		reportId: report.id,
		playername: report.playername,
		action: FAGCBot.GuildConfig.onReport,
	}})

	const msg = `You have a violation on FAGC. Please check ${FAGCBot.config.apiurl}/reports/getall?playername=${report.playername} for why this could be`
	const jailCommand = FAGCBot.config.jailCommand.replace("${PLAYERNAME}", report.playername).replace("${REASON}", msg)
	const banCommand = FAGCBot.config.banCommand.replace("${PLAYERNAME}", report.playername).replace("${REASON}", msg)
	switch (FAGCBot.GuildConfig.onReport) {
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
	if (!rule) return false

	const community = FAGCBot.fagcconfig.trustedCommunities.find(communityId => communityId === revocation.communityId)
	if (!community) return false

	const allReports = await client.getFilteredReports(revocation.playername)
	if (allReports.length) return false // there is more than one open report for this player

	return HandleFilteredRevocation(revocation, client)
}

async function HandleFilteredRevocation (revocation: Revocation, client: FAGCBot): Promise<boolean> {
	const unjailCommand = FAGCBot.config.unjailCommand.replace("${PLAYERNAME}", revocation.playername)
	const unbanCommand = FAGCBot.config.unbanCommand.replace("${PLAYERNAME}", revocation.playername)
	switch (FAGCBot.GuildConfig.onRevocation) {
	case "info": return false
	case "removeBan":
		await client.prisma.handledReports.deleteMany({where: {reportId: revocation.reportId}})
		rcon.rconCommandAll(unbanCommand)
		rcon.rconCommandAll(unjailCommand)
		return true
	default: return false
	}
}
