import { FastifyReply, FastifyRequest } from "fastify"
import { Controller, GET } from "fastify-decorators"
import { Type } from "@sinclair/typebox"

import ReportModel, { ReportClass } from "../database/fagc/report"
import { Profile } from "fagc-api-types"
import { DocumentType } from "@typegoose/typegoose"
import { BeAnObject } from "@typegoose/typegoose/lib/types"
import RevocationModel from "../database/fagc/revocation"

@Controller({ route: "/revocations" })
export default class ProfileController {
	@GET({url: "/community/:playername/:communityId", options: {
		schema: {
			params: Type.Required(Type.Object({
				playername: Type.String(),
				communityId: Type.String()
			}))
		}
	}})
	async fetchCommunity(req: FastifyRequest<{
		Params: {
			playername: string
			communityId: string
		}
	}>, res: FastifyReply): Promise<FastifyReply> {
		const {playername, communityId} = req.params
		
		const revocations = await RevocationModel.find({
			playername: playername,
			communityId: communityId
		})
		return res.send(revocations)
	}
	@GET({url: "/player/:playername", options: {
		schema: {
			params: Type.Required(Type.Object({
				playername: Type.String(),
			}))
		}
	}})
	async fetchPlayer(req: FastifyRequest<{
		Params: {
			playername: string
		}
	}>, res: FastifyReply): Promise<FastifyReply> {
		const {playername} = req.params
		
		const revocations = await RevocationModel.find({
			playername: playername,
		})
		return res.send(revocations)
	}
}