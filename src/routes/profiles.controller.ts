import { FastifyReply, FastifyRequest } from "fastify"
import { Controller, GET } from "fastify-decorators"
import { Type } from "@sinclair/typebox"

import ReportModel, { ReportClass } from "../database/fagc/report.js"
import { Profile } from "fagc-api-types"
import { DocumentType } from "@typegoose/typegoose"
import { BeAnObject } from "@typegoose/typegoose/lib/types"

@Controller({ route: "/profiles" })
export default class ProfileController {
	@GET({
		url: "/fetchcommunity/:playername/:communityId",
		options: {
			schema: {
				params: Type.Required(
					Type.Object({
						playername: Type.String(),
						communityId: Type.String(),
					})
				),

				description: "Fetch a report of a player in a community",
				tags: ["profiles"],
				response: {
					"200": {
						allOf: [{ nullable: true }, { $ref: "Profile#" }],
					},
				},
			},
		},
	})
	async fetchCommunity(
		req: FastifyRequest<{
			Params: {
				playername: string
				communityId: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { playername, communityId } = req.params

		const reports = await ReportModel.find({
			playername: playername,
			communityId: communityId,
		})
		const profile: Profile = {
			playername: playername,
			communityId: communityId,
			// there has to be a cast to <any> as Mongoose document is not compatible with the Profile
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			reports: reports.map((report) => <any>report.toObject()),
		}
		return res.send(profile)
	}

	@GET({
		url: "/fetchall/:playername",
		options: {
			schema: {
				params: Type.Required(
					Type.Object({
						playername: Type.String(),
					})
				),

				description: "Fetch all reports of a player",
				tags: ["profiles"],
				response: {
					"200": {
						type: "array",
						items: {
							allOf: [{ nullable: true }, { $ref: "Profile#" }],
						},
					},
				},
			},
		},
	})
	async fetchAll(
		req: FastifyRequest<{
			Params: {
				playername: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { playername } = req.params

		const reports = await ReportModel.find({
			playername: playername,
		})

		const profilesMap = new Map<
			string,
			{
				playername: string
				communityId: string
				reports: DocumentType<ReportClass, BeAnObject>[]
			}
		>()

		reports.forEach((report) => {
			const profile = profilesMap.get(report.communityId)
			if (profile) {
				profile.reports.push(report)
				profilesMap.set(report.communityId, profile)
			} else {
				profilesMap.set(report.communityId, {
					playername: report.playername,
					communityId: report.communityId,
					reports: [report],
				})
			}
		})

		const profiles: {
			playername: string
			communityId: string
			reports: DocumentType<ReportClass>[]
		}[] = []
		profilesMap.forEach((profile) => profiles.push(profile))

		return res.send(profiles)
	}
}
