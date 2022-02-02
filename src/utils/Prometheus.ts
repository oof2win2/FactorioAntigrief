import promClient from "prom-client"
import http from "http"
import GuildConfigModel, {
	GuildConfigClass,
} from "../database/guildconfig"
import CommunityModel, { CommunityClass } from "../database/community"
import CategoryModel from "../database/category"
import { DocumentType } from "@typegoose/typegoose"
import ENV from "./env"

const collectDefaultMetrics = promClient.collectDefaultMetrics
const Registry = promClient.Registry
const register = new Registry()
collectDefaultMetrics({ register })

const communityGauge = new promClient.Gauge({
	name: "community_trust_count",
	help: "Amount of communities that trust this community",
	labelNames: [ "id", "name", "contact" ],
})
const categoryGauge = new promClient.Gauge({
	name: "category_trust_count",
	help: "Amount of communities that trust this category",
	labelNames: [ "id", "name" ],
})

register.registerMetric(communityGauge)
register.registerMetric(categoryGauge)

// Format community trust from config
const trustedCommunities = async (
	communities: Omit<DocumentType<GuildConfigClass>, "apikey">[]
) => {
	const rawResults: { id: string; count: number }[] = []
	const CachedCommunities = new Map()
	const getOrFetchCommunity = async (
		communityId: string
	): Promise<DocumentType<CommunityClass>> => {
		const cachedCommunity = CachedCommunities.get(communityId)
		if (cachedCommunity) return cachedCommunity
		const community = CachedCommunities.set(
			communityId,
			CommunityModel.findOne({ id: communityId })
		).get(communityId)
		return community
	}
	communities.forEach((community) => {
		community.trustedCommunities?.forEach((communityId) => {
			let found = false
			rawResults.forEach((trusted) => {
				if (trusted.id === communityId) {
					trusted.count++
					found = true
				}
			})
			if (!found) {
				rawResults.push({ id: communityId, count: 1 })
			}
		})
	})
	const results = rawResults.map(async (community) => {
		return {
			community: await getOrFetchCommunity(community.id),
			count: community.count,
		}
	})
	return await Promise.all(results)
}
// Format category trust from config
const trustedCategories = async (
	communities: Omit<DocumentType<GuildConfigClass>, "apikey">[]
) => {
	const rawResults: { id: string; count: number }[] = []
	const CachedCategories = new Map()
	const getOrFetchCategory = async (categoryId: string) => {
		const cachedCategory = CachedCategories.get(categoryId)
		if (cachedCategory) return cachedCategory
		const category = CachedCategories.set(
			categoryId,
			CategoryModel.findOne({ id: categoryId })
		).get(categoryId)
		return category
	}
	communities.forEach((community) => {
		community.categoryFilters?.forEach((categoryId) => {
			let found = false
			rawResults.forEach((trusted) => {
				if (trusted.id === categoryId) {
					trusted.count++
					found = true
				}
			})
			if (!found) {
				rawResults.push({ id: categoryId, count: 1 })
			}
		})
	})
	const results = rawResults.map(async (category) => {
		return {
			category: await getOrFetchCategory(category.id),
			count: category.count,
		}
	})
	return await Promise.all(results)
}

// collect statistics and put them to the server
const collectStatistics = async () => {
	const communitySettings = await GuildConfigModel.find({})
		.exec()
		.then((configs) =>
			configs.map((CommunityConfig) => {
				CommunityConfig.set("apikey", null)
				return CommunityConfig
			})
		)
	const categories = await trustedCategories(communitySettings)
	const communities = await trustedCommunities(communitySettings)

	categories.forEach((category) => {
		if (category.category)
			categoryGauge.set(
				{ id: category.category.id, name: category.category.name },
				category.count
			)
	})
	communities.forEach((community) => {
		if (!community.community || !community.community.id) return
		communityGauge.set(
			{
				id: community.community.id,
				name: community.community.name,
				contact: community.community.contact,
			},
			community.count
		)
	})
}

setInterval(async () => {
	collectStatistics()
}, 3600 * 1000 * 3) // collect every 3 hours (3*3600*1000)
collectStatistics() // initial statistics collection

// Server for data collection
http.createServer(async (req, res) => {
	if (!req.url) return
	if (req.url.endsWith("/metrics")) {
		return res.end(await register.metrics())
	}
}).listen(ENV.PROMETHEUS_PORT)
