import CommunityModel from "../src/database/community"
import GuildConfigModel from "../src/database/guildconfig"
import ReportInfoModel from "../src/database/reportinfo"
import WebhookModel from "../src/database/webhook"
import { createApikey } from "../src/utils/authentication"
import { validateDiscordUser } from "./mockDiscord"
import { backend, testCategories, testCommunity } from "./prepareTest"
import { toJson, createReport, createRevocation } from "./utils"

describe("GET /communities", () => {
	it("Should return all communities", async () => {
		const response = await backend.inject({
			method: "GET",
			path: "/communities",
		})
		expect(response.statusCode).toBe(200)
		const json = response.json()
		expect(json.length).toBe(1)
		expect(json[0]).toEqual(toJson(testCommunity))
	})
})

describe("GET /communities/:id", () => {
	it("Should return a community by it's ID", async () => {
		const response = await backend.inject({
			method: "GET",
			path: `/communities/${testCommunity.id}`,
		})
		expect(response.statusCode).toBe(200)
		const json = response.json()
		expect(json).toEqual(toJson(testCommunity))
	})
	it("Should return null if the community does not exist", async () => {
		const response = await backend.inject({
			method: "GET",
			path: "/communities/xxxxxx",
		})
		expect(response.statusCode).toBe(200)
		const json = response.json()
		expect(json).toBeNull()
	})
})

describe("GET /communities/own", () => {
	it("Should return own community if authenticated", async () => {
		const apikey = await createApikey(testCommunity)
		const response = await backend.inject({
			method: "GET",
			path: "/communities/own",
			headers: {
				"authorization": `Bearer ${apikey}`
			},
		})
		expect(response.statusCode).toBe(200)
		const json = response.json()
		expect(json).toEqual(toJson(testCommunity))
	})
	it("Should return 401 if missing credentials", async () => {
		const response = await backend.inject({
			method: "GET",
			path: "/communities/own",
		})
		const json = response.json()
		expect(response.statusCode).toBe(401)
		expect(response.headers["www-authenticate"]).toBe('Bearer realm="private" Bearer realm="master"')
		expect(json.error).toBe("Unauthorized")
	})
	it("Should return 401 if unknown scheme", async () => {
		const response = await backend.inject({
			method: "GET",
			path: "/communities/own",
			headers: {
				"authorization": `Token token`
			},
		})
		const json = response.json()
		expect(response.statusCode).toBe(401)
		expect(json.error).toBe("Unauthorized")
	})
	it("Should return 401 if API key is valid, but community does not exist", async () => {
		const missingCommunity = await CommunityModel.create({ name: "missing", contact: "12345" })
		const apikey = await createApikey(missingCommunity)
		await CommunityModel.findOneAndDelete({ id: missingCommunity.id });
		const response = await backend.inject({
			method: "GET",
			path: "/communities/own",
			headers: {
				"authorization": `Bearer ${apikey}`
			},
		})
		const json = response.json()
		expect(response.statusCode).toBe(401)
		expect(json.error).toBe("Unauthorized")
	})
	it("Should return 401 if the authentication is wrong", async () => {
		const apikey = await createApikey(testCommunity)
		const response = await backend.inject({
			method: "GET",
			path: "/communities/own",
			headers: {
				"authorization": `Bearer ${apikey}0x1`
			},
		})
		const json = response.json()
		expect(response.statusCode).toBe(401)
		expect(json.error).toBe("Unauthorized")
	})
	it("Should return 401 if the key is revoked", async () => {
		const apikey = await createApikey(testCommunity)
		await CommunityModel.findOneAndUpdate({ id: testCommunity.id }, { tokenInvalidBefore: new Date() })
		try {
			const response = await backend.inject({
				method: "GET",
				path: "/communities/own",
				headers: {
					"authorization": `Bearer ${apikey}`
				},
			})
			const json = response.json()
			expect(response.statusCode).toBe(401)
			expect(json.error).toBe("Unauthorized")
		} finally {
			await CommunityModel.findOneAndUpdate({ id: testCommunity.id }, testCommunity)
		}
	})
})

describe("PATCH /communities/own", () => {
	it("Should return 400 if contact is not a discord user id", async () => {
		const apikey = await createApikey(testCommunity)
		const response = await backend.inject({
			method: "PATCH",
			path: "/communities/own",
			headers: {
				"authorization": `Bearer ${apikey}`
			},
			payload: {
				contact: "abc",
			},
		})
		const json = response.json()
		expect(response.statusCode).toBe(400)
		expect(json.error).toBe("Bad Request")
	})
	it("Should update contact if passed", async () => {
		const apikey = await createApikey(testCommunity)
		try {
			const response = await backend.inject({
				method: "PATCH",
				path: "/communities/own",
				headers: {
					"authorization": `Bearer ${apikey}`
				},
				payload: {
					contact: "999",
				},
			})
			const json = response.json()
			expect(response.statusCode).toBe(200)
			expect(json.contact).toBe("999")
			const updated = await CommunityModel.findOne({ id: testCommunity.id })
			expect(updated!.contact).toBe("999")
		} finally {
			await CommunityModel.findOneAndUpdate({ id: testCommunity.id }, testCommunity)
		}
	})
	it("Should update name if passed", async () => {
		const apikey = await createApikey(testCommunity)
		try {
			const response = await backend.inject({
				method: "PATCH",
				path: "/communities/own",
				headers: {
					"authorization": `Bearer ${apikey}`
				},
				payload: {
					name: "A test",
				},
			})
			const json = response.json()
			expect(response.statusCode).toBe(200)
			expect(json.name).toBe("A test")
			const updated = await CommunityModel.findOne({ id: testCommunity.id })
			expect(updated!.name).toBe("A test")
		} finally {
			await CommunityModel.findOneAndUpdate({ id: testCommunity.id }, testCommunity)
		}
	})
})

describe("POST /communities/own/apikey", () => {
	it("Should invalidate token", async () => {
		const apikey = await createApikey(testCommunity)
		try {
			const response = await backend.inject({
				method: "POST",
				path: "/communities/own/apikey",
				headers: {
					"authorization": `Bearer ${apikey}`
				},
				payload: {
					invalidate: true,
				},
			})
			expect(response.statusCode).toBe(200)
			const followup = await backend.inject({
				method: "GET",
				path: "/communities/own",
				headers: {
					"authorization": `Bearer ${apikey}`
				},
			})
			expect(followup.statusCode).toBe(401)
		} finally {
			await CommunityModel.findOneAndUpdate({ id: testCommunity.id }, testCommunity)
		}
	})
	it("Should create a token", async () => {
		const apikey = await createApikey(testCommunity)
		const response = await backend.inject({
			method: "POST",
			path: "/communities/own/apikey",
			headers: {
				"authorization": `Bearer ${apikey}`
			},
			payload: {
				create: true,
			},
		})
		expect(response.statusCode).toBe(200)
		const json = response.json()
		const followup = await backend.inject({
			method: "GET",
			path: "/communities/own",
			headers: {
				"authorization": `Bearer ${json.apiKey}`
			},
		})
		expect(followup.statusCode).toBe(200)
	})
})

describe("POST /communities/:id/apikey", () => {
	it("should return 401 if given a private key", async () => {
		const apikey = await createApikey(testCommunity)
		const response = await backend.inject({
			method: "POST",
			path: `/communities/${testCommunity.id}/apikey`,
			headers: {
				"authorization": `Bearer ${apikey}`
			},
			payload: {
				create: true,
			},
		})
		expect(response.statusCode).toBe(401)
		const json = response.json()
		expect(json.error).toBe("Unauthorized")
	})
	it("Should invalidate token", async () => {
		const apikey = await createApikey(testCommunity, "master")
		try {
			const response = await backend.inject({
				method: "POST",
				path: `/communities/${testCommunity.id}/apikey`,
				headers: {
					"authorization": `Bearer ${apikey}`
				},
				payload: {
					invalidate: true,
				},
			})
			expect(response.statusCode).toBe(200)
			const followup = await backend.inject({
				method: "GET",
				path: "/communities/own",
				headers: {
					"authorization": `Bearer ${apikey}`
				},
			})
			expect(followup.statusCode).toBe(401)
		} finally {
			await CommunityModel.findOneAndUpdate({ id: testCommunity.id }, testCommunity)
		}
	})
	it("Should create a token", async () => {
		const apikey = await createApikey(testCommunity, "master")
		const response = await backend.inject({
			method: "POST",
			path: `/communities/${testCommunity.id}/apikey`,
			headers: {
				"authorization": `Bearer ${apikey}`
			},
			payload: {
				create: true,
			},
		})
		expect(response.statusCode).toBe(200)
		const json = response.json()
		const followup = await backend.inject({
			method: "GET",
			path: "/communities/own",
			headers: {
				"authorization": `Bearer ${json.apiKey}`
			},
		})
		expect(followup.statusCode).toBe(200)
	})
})

describe("POST /communities", () => {
	it("Should return 400 if contact is not a discord user id", async () => {
		const apikey = await createApikey(testCommunity, "master")
		validateDiscordUser.mockReturnValueOnce(Promise.resolve({ bot: true } as any));
		const response = await backend.inject({
			method: "POST",
			path: "/communities",
			headers: {
				"authorization": `Bearer ${apikey}`
			},
			payload: {
				name: "New community",
				contact: "abc",
			},
		})
		expect(response.statusCode).toBe(400)
		const json = response.json()
		expect(json.error).toBe("Invalid Discord User")
	})
	it("Should return 400 if contact is a bot", async () => {
		const apikey = await createApikey(testCommunity, "master")
		validateDiscordUser.mockReturnValueOnce(Promise.resolve({ bot: true } as any));
		const response = await backend.inject({
			method: "POST",
			path: "/communities",
			headers: {
				"authorization": `Bearer ${apikey}`
			},
			payload: {
				name: "New community",
				contact: "222",
			},
		})
		expect(response.statusCode).toBe(400)
		const json = response.json()
		expect(json.error).toBe("Invalid Discord User")
	})
	it("Should create a community", async () => {
		const apikey = await createApikey(testCommunity, "master")
		try {
			const response = await backend.inject({
				method: "POST",
				path: "/communities",
				headers: {
					"authorization": `Bearer ${apikey}`
				},
				payload: {
					name: "New community",
					contact: "222",
				},
			})
			expect(response.statusCode).toBe(200)
			const json = response.json()
			const community = await CommunityModel.findOne({ id: json.community.id })
			expect(community).not.toBeNull()
			const followup = await backend.inject({
				method: "GET",
				path: "/communities/own",
				headers: {
					"authorization": `Bearer ${json.apiKey}`
				},
			})
			expect(followup.statusCode).toBe(200)
		} finally {
			await CommunityModel.findOneAndDelete({ name: "New community" })
		}
	})
})

describe("DELETE /communities/:id", () => {
	it("Should return 404 if community does not exist", async () => {
		const apikey = await createApikey(testCommunity, "master")
		const response = await backend.inject({
			method: "DELETE",
			path: "/communities/xxxxxx",
			headers: {
				"authorization": `Bearer ${apikey}`
			},
		})
		expect(response.statusCode).toBe(404)
	})
	it("Should delete community", async () => {
		const newCommunity = await CommunityModel.create({ name: "New community", contact: "222" })
		const newGuild = await GuildConfigModel.create({
			communityId: newCommunity.id,
			guildId: "10002",
			trustedCommunities: [],
			categoryFilters: [testCategories[0].id],
		})
		const trustingGuild = await GuildConfigModel.create({
			communityId: testCommunity.id,
			guildId: "10003",
			trustedCommunities: [newCommunity.id],
			categoryFilters: [testCategories[0].id],
		})
		const newReport = await ReportInfoModel.create(createReport({
			communityId: newCommunity.id,
			categoryId: testCategories[0].id,
		}))
		const newRevocation = await ReportInfoModel.create(createRevocation({
			communityId: newCommunity.id,
			categoryId: testCategories[0].id,
		}))
		const newWebhook = await WebhookModel.create({ id: "110", token: "token", guildId: "10002" })
		const apikey = await createApikey(testCommunity, "master")
		const response = await backend.inject({
			method: "DELETE",
			path: `/communities/${newCommunity.id}`,
			headers: {
				"authorization": `Bearer ${apikey}`
			},
		})
		expect(response.statusCode).toBe(200)
		expect(await CommunityModel.findOne({ id: newCommunity.id })).toBeNull()
		expect((await GuildConfigModel.findOne({ guildId: trustingGuild.guildId }))!.trustedCommunities).toEqual([])
		expect(await GuildConfigModel.findOne({ guildId: newGuild.guildId })).toBeNull()
		expect(await ReportInfoModel.findOne({ id: newReport.id })).toBeNull()
		expect(await ReportInfoModel.findOne({ id: newRevocation.id })).toBeNull()
		expect(await WebhookModel.findOne({ id: newWebhook.id })).toBeNull()
		await GuildConfigModel.findOneAndDelete({ guildId: trustingGuild.guildId })
	})
})

describe("POST /communities/:id/merge/:id", () => {
	it("Should return 400 if community does not exist", async () => {
		const apikey = await createApikey(testCommunity, "master")
		const response = await backend.inject({
			method: "PATCH",
			path: `/communities/xxxxxx/merge/${testCommunity.id}`,
			headers: {
				"authorization": `Bearer ${apikey}`
			},
		})
		expect(response.statusCode).toBe(400)
	})
	it("Should return 400 if community does not exist", async () => {
		const apikey = await createApikey(testCommunity, "master")
		const response = await backend.inject({
			method: "PATCH",
			path: `/communities/${testCommunity.id}/merge/xxxxxx`,
			headers: {
				"authorization": `Bearer ${apikey}`
			},
		})
		expect(response.statusCode).toBe(400)
	})
	it("Should merge community", async () => {
		const recvCommunity = await CommunityModel.create({ name: "Recv community", contact: "111" })
		const recvGuild = await GuildConfigModel.create({
			communityId: recvCommunity.id,
			guildId: "10002",
			trustedCommunities: [],
			categoryFilters: [testCategories[0].id],
		})
		const recvReport = await ReportInfoModel.create(createReport({
			communityId: recvCommunity.id,
			categoryId: testCategories[0].id,
		}))
		const recvRevocation = await ReportInfoModel.create(createRevocation({
			communityId: recvCommunity.id,
			categoryId: testCategories[0].id,
		}))
		const recvWebhook = await WebhookModel.create({ id: "110", token: "token", guildId: "10002" })
		const dissCommunity = await CommunityModel.create({ name: "New community", contact: "222" })
		const dissGuild = await GuildConfigModel.create({
			communityId: dissCommunity.id,
			guildId: "20002",
			trustedCommunities: [],
			categoryFilters: [testCategories[1].id],
		})
		const trustingGuild = await GuildConfigModel.create({
			communityId: testCommunity.id,
			guildId: "10003",
			trustedCommunities: [dissCommunity.id, recvCommunity.id],
			categoryFilters: [testCategories[1].id],
		})
		const dissReport = await ReportInfoModel.create(createReport({
			communityId: dissCommunity.id,
			categoryId: testCategories[1].id,
		}))
		const dissRevocation = await ReportInfoModel.create(createRevocation({
			communityId: dissCommunity.id,
			categoryId: testCategories[1].id,
		}))
		const dissWebhook = await WebhookModel.create({ id: "220", token: "token", guildId: "20002" })
		const apikey = await createApikey(testCommunity, "master")
		const response = await backend.inject({
			method: "PATCH",
			path: `/communities/${recvCommunity.id}/merge/${dissCommunity.id}`,
			headers: {
				"authorization": `Bearer ${apikey}`
			},
		})
		expect(response.statusCode).toBe(200)
		expect(await CommunityModel.findOne({ id: dissCommunity.id })).toBeNull()
		expect(await CommunityModel.findOne({ id: recvCommunity.id })).not.toBeNull()
		expect(await GuildConfigModel.findOne({ guildId: dissGuild.guildId })).not.toBeNull()
		expect((await GuildConfigModel.findOne({ guildId: trustingGuild.guildId }))!.trustedCommunities)
			.toEqual([recvCommunity.id])
		expect((await ReportInfoModel.findOne({ id: recvReport.id }))!.communityId)
			.toEqual(recvCommunity.id)
		expect((await ReportInfoModel.findOne({ id: dissReport.id }))!.communityId)
			.toEqual(recvCommunity.id)
		expect((await ReportInfoModel.findOne({ id: recvRevocation.id }))!.communityId)
			.toEqual(recvCommunity.id)
		expect((await ReportInfoModel.findOne({ id: dissRevocation.id }))!.communityId)
			.toEqual(recvCommunity.id)
		expect(await WebhookModel.findOne({ id: recvWebhook.id })).not.toBeNull()
		expect(await WebhookModel.findOne({ id: dissWebhook.id })).not.toBeNull()
		await CommunityModel.findOneAndDelete({ id: recvCommunity.id })
		await GuildConfigModel.findOneAndDelete({ guildId: recvGuild.guildId })
		await GuildConfigModel.findOneAndDelete({ guildId: dissGuild.guildId })
		await GuildConfigModel.findOneAndDelete({ guildId: trustingGuild.guildId })
		await ReportInfoModel.findOneAndDelete({ id: recvReport.id })
		await ReportInfoModel.findOneAndDelete({ id: dissReport.id })
		await ReportInfoModel.findOneAndDelete({ id: recvRevocation.id })
		await ReportInfoModel.findOneAndDelete({ id: dissRevocation.id })
		await WebhookModel.findOneAndDelete({ id: recvWebhook.id })
		await WebhookModel.findOneAndDelete({ id: dissWebhook.id })
	})
})