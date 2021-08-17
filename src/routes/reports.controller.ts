import { FastifyReply, FastifyRequest } from "fastify"
import { Controller, GET, POST, DELETE } from "fastify-decorators"
import { Type } from "@sinclair/typebox"

import RuleModel from "../database/fagc/rule.js"
import { Authenticate } from "../utils/authentication.js"
import { reportCreatedMessage, reportRevokedMessage } from "../utils/info.js"
import ReportModel from "../database/fagc/report.js"
import RevocationModel from "../database/fagc/revocation.js"
import { validateDiscordUser } from "../utils/discord.js"

@Controller({ route: "/reports" })
export default class ReportController {
	@GET({
		url: "/:id", options: {
			schema: {
				params: Type.Required(Type.Object({
					id: Type.String()
				}))
			}
		}
	})
	async getReport(req: FastifyRequest<{
		Params: {
			id: string
		}
	}>, res: FastifyReply): Promise<FastifyReply> {
		const { id } = req.params
		const community = await ReportModel.findOne({ id: id })
		return res.send(community)
	}

	@GET({ url: "/rule/:id", options: {
		schema: {
			params: Type.Required(Type.Object({
				id: Type.String()
			}))
		}
	} })
	async getByRule(req: FastifyRequest<{
		Params: {
			id: string
		}
	}>, res: FastifyReply): Promise<FastifyReply> {
		const reports = await ReportModel.find({ brokenRule: req.params.id })
		return res.status(200).send(reports)
	}

	@GET({
		url: "/getplayer/:playername", options: {
			schema: {
				params: Type.Required(Type.Object({
					playername: Type.String()
				}))
			}
		}
	})
	async getPlayer(req: FastifyRequest<{
		Params: {
			playername: string
		}
	}>, res: FastifyReply): Promise<FastifyReply> {
		const reports = await ReportModel.find({playername: req.params.playername})
		return res.status(200).send(reports)
	}

	@GET({ url: "/getplayercommunity/:playername/:communityId", options: {
		schema: {
			params: Type.Required(Type.Object({
				playername: Type.String(),
				communityId: Type.String(),
			}))
		}
	} })
	async getPlayerCommunity(req: FastifyRequest<{
		Params: {
			playername: string,
			communityId: string
		}
	}>, res: FastifyReply): Promise<FastifyReply> {
		const reports = await ReportModel.find({
			playername: req.params.playername,
			communityId: req.params.communityId
		})
		return res.status(200).send(reports)
	}

	@POST({url: "/", options: {
		schema: {
			body: Type.Required(Type.Object({
				adminId: Type.String(),
				playername: Type.String(),
				brokenRule: Type.String(),
				automated: Type.Boolean({default: false}),
				reportedTime: Type.String({default: new Date().toISOString()}),
				description: Type.String({default: "No description"}),
				proof: Type.String({default: "No proof"})
			}))
		}
	}})
	@Authenticate
	async createReport(req: FastifyRequest<{
		Body: {
			adminId: string,
			playername: string,
			brokenRule: string,
			automated: boolean,
			reportedTime: string,
			description: string,
			proof: string
		}
	}>, res: FastifyReply): Promise<FastifyReply> {
		const {adminId, playername, brokenRule, automated, reportedTime, description, proof} = req.body

		const community = req.requestContext.get("community")
		if (!community) return res.status(400).send({errorCode: 400, error: "Community Not Found", message: "Your community could not be found"})
		
		const rule = await RuleModel.findOne({id: brokenRule})
		if (!rule) return res.status(400).send({errorCode: 400, error: "Bad Request", message: "brokenRule must be a valid ID"})
		
		const isDiscordUser = await validateDiscordUser(adminId)
		if (!isDiscordUser) return res.status(400).send({errorCode: 400, error: "Bad Request", message: "adminId must be a valid Discord user"})
		
		const report = await ReportModel.create({
			playername: playername,
			adminId: adminId,
			brokenRule: brokenRule,
			automated: automated,
			reportedTime: reportedTime,
			description: description,
			proof: proof,
			communityId: community.id
		})
		reportCreatedMessage(report)
		return res.status(200).send(report)
	}

	@DELETE({url: "/", options: {
		schema: {
			body: Type.Required(Type.Object({
				adminId: Type.String(),
				id: Type.String(),
			}))
		}
	}})
	@Authenticate
	async revokeReport(req: FastifyRequest<{
		Body: {
			adminId: string,
			id: string
		}
	}>, res: FastifyReply): Promise<FastifyReply> {
		const community = req.requestContext.get("community")
		if (!community) return res.status(400).send({errorCode: 400, error: "Community Not Found", message: "Your community could not be found"})

		const report = await ReportModel.findOne({id: req.body.id})
		if (!report) return res.status(404).send({errorCode: 404, error: "Not Found", message: "Report could not be found"})
		if (report.communityId !== community.id)
			return res.status(403).send({errorCode: 403, error: "Access Denied", message: `You are trying to access a report of community ${report.communityId} but your community ID is ${community.id}`})
		
		const isDiscordUser = await validateDiscordUser(req.body.adminId)
		if (!isDiscordUser) return res.status(400).send({errorCode: 400, error: "Bad Request", message: "adminId must be a valid Discord user"})
		
		await ReportModel.findByIdAndDelete(report._id)
		
		const revocation = await RevocationModel.create({
			reportId: report.id,
			playername: report.playername,
			communityId: report.communityId,
			brokenRule: report.brokenRule,
			proof: report.proof,
			description: report.description,
			automated: report.automated,
			reportedTime: report.reportedTime,
			adminId: report.adminId,
			revokedTime: new Date(),
			revokedBy: req.body.adminId,
		})
		reportRevokedMessage(revocation)
		return res.status(200).send(revocation)
	}

	@DELETE({url: "/revokeallname", options: {
		schema: {
			body: Type.Required(Type.Object({
				adminId: Type.String(),
				playername: Type.String(),
			}))
		}
	}})
	@Authenticate
	async revokeAllPlayer(req: FastifyRequest<{
		Body: {
			adminId: string,
			playername: string
		}
	}>, res: FastifyReply): Promise<FastifyReply> {
		const {adminId, playername} = req.body

		const community = req.requestContext.get("community")
		if (!community) return res.status(400).send({errorCode: 400, error: "Community Not Found", message: "Your community could not be found"})
		
		const isDiscordUser = await validateDiscordUser(adminId)
		if (!isDiscordUser) return res.status(400).send({errorCode: 400, error: "Bad Request", message: "adminId must be a valid Discord user"})

		const reports = await ReportModel.find({
			communityId: community.id,
			playername: playername
		})
		const revocations = await Promise.all(reports.map(async (report) => {
			const revocation = await RevocationModel.create({
				reportId: report.id,
				playername: report.playername,
				communityId: report.communityId,
				brokenRule: report.brokenRule,
				proof: report.proof,
				description: report.description,
				automated: report.automated,
				reportedTime: report.reportedTime,
				adminId: report.adminId,
				revokedTime: new Date(),
				revokedBy: adminId,
			})
			await report.remove()
			return revocation
		}))

		revocations.forEach((revocation) => reportRevokedMessage(revocation))

		return res.status(200).send(revocations)
	}
}