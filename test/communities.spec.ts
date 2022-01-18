import CommunityModel from "../src/database/community"
import { Community } from "fagc-api-types"
import { createApikey } from "../src/utils/authentication"
import backend from "./prepareTest"
import * as mockingoose from "mockingoose"
import { createCommunities, createCommunity } from "./utils"
import { z } from "zod"

describe("GET /", () => {
	it("Should return all communities", async () => {
		const communities = createCommunities(10)

		mockingoose(CommunityModel).toReturn(communities, "find")

		const result = await backend.inject({
			method: "GET",
			path: "/communities",
		})
		const json = await result.json()
		
		expect(json.length).toBe(communities.length)
		expect(z.array(Community).parse(json)).toEqual(communities)
	})
})

describe("GET /:id", () => {
	it("Should return a community by it's ID", async () => {
		const community = createCommunity()

		mockingoose(CommunityModel).toReturn(community, "findOne")
		
		const result = await backend.inject({
			method: "GET",
			path: `/communities/${community.id}`,
		})
		const json = await result.json()
		
		expect(Community.parse(json)).toEqual(community)
	})
	it("Should return null if the community does not exist", async () => {
		mockingoose(CommunityModel).toReturn(null, "findOne")

		const result = await backend.inject({
			method: "GET",
			path: "/communities/2",
		})
		const json = await result.json()

		expect(json).toBeNull()
	})
})

describe("GET /own", () => {
	it("Should return own community if authenticated", async () => {
		const community = createCommunity()
		const apikey = await createApikey(community)

		mockingoose(CommunityModel).toReturn(community, "findOne")
		
		const result = await backend.inject({
			method: "GET",
			path: "/communities/own",
			headers: {
				"authorization": `Bearer ${apikey}`
			}
		}).then(x=>x.json())


		expect(Community.parse(result)).toEqual(community)
	})
	it("Should throw an error if API key format is correct, but community was not found", async () => {
		const community = createCommunity()
		const apikey = await createApikey(community)

		mockingoose(CommunityModel).toReturn(null, "findOne")
		
		const result = await backend.inject({
			method: "GET",
			path: "/communities/own",
			headers: {
				"authorization": `Bearer ${apikey}`
			}
		})
		const json = await result.json()
		expect(result.statusCode).toBe(401)
		expect(json.error).toBe("Unauthorized")
	})
	it("Should throw an error if the authentication is wrong", async () => {
		const community = createCommunity()
		const apikey = await createApikey(community)

		mockingoose(CommunityModel).toReturn(community, "findOne")
		
		const result = await backend.inject({
			method: "GET",
			path: "/communities/own",
			headers: {
				"authorization": `Bearer ${apikey}0x1`
			}
		})
		const json = await result.json()
		expect(result.statusCode).toBe(401)
		expect(json.error).toBe("Unauthorized")

	})
})