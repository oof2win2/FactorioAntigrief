import promClient from "prom-client"
import http from "http"
import GuildConfigModel, { GuildConfigClass } from "../database/guildconfig"
import CommunityModel, { CommunityClass } from "../database/community"
import CategoryModel, { CategoryClass } from "../database/category"
import { DocumentType } from "@typegoose/typegoose"
import ENV from "./env"
import FilterModel, { FilterClass } from "../database/filterobject"

const collectDefaultMetrics = promClient.collectDefaultMetrics
const Registry = promClient.Registry
const register = new Registry()
collectDefaultMetrics({ register })

const communityGauge = new promClient.Gauge({
	name: "community_trust_count",
	help: "Amount of communities that trust this community",
	labelNames: ["id", "name", "contact"],
})
const categoryGauge = new promClient.Gauge({
	name: "category_trust_count",
	help: "Amount of communities that trust this category",
	labelNames: ["id", "name"],
})

register.registerMetric(communityGauge)
register.registerMetric(categoryGauge)

type Result<T> = {
	item: T
	count: number
}[]

// Format community trust from config
const trustedCommunities = async (
	filters: DocumentType<FilterClass>[]
): Promise<Result<CommunityClass>> => {
	const communityIds = new Set(
		...filters.map((filter) => filter.communityFilters)
	)
	const communities = await CommunityModel.find({
		id: {
			$in: [...communityIds],
		},
	})

	// count the communities
	const count = filters
		.map((filter) => filter.communityFilters)
		.flat()
		.reduce<Record<string, number>>((acc, filter) => {
			return {
				...acc,
				[filter]: (acc[filter] || 0) + 1,
			}
		}, {})

	return Object.entries(count).map(([communityId, count]) => {
		return {
			item: communities.find((c) => c.id === communityId)!,
			count,
		}
	})
}
// Format category trust from config
const trustedCategories = async (
	filters: DocumentType<FilterClass>[]
): Promise<Result<CategoryClass>> => {
	const categoryIds = new Set(
		...filters.map((filter) => filter.categoryFilters)
	)
	const categories = await CategoryModel.find({
		id: {
			$in: [...categoryIds],
		},
	})

	// count the communities
	const count = filters
		.map((filter) => filter.categoryFilters)
		.flat()
		.reduce<Record<string, number>>((acc, filter) => {
			return {
				...acc,
				[filter]: (acc[filter] || 0) + 1,
			}
		}, {})

	return Object.entries(count).map(([categoryId, count]) => {
		return {
			item: categories.find((c) => c.id === categoryId)!,
			count,
		}
	})
}

// collect statistics and put them to the server
const collectStatistics = async () => {
	const communitySettings = await FilterModel.find()
	const categories = await trustedCategories(communitySettings)
	const communities = await trustedCommunities(communitySettings)

	categories.forEach((category) => {
		categoryGauge.set(
			{ id: category.item.id, name: category.item.name },
			category.count
		)
	})
	communities.forEach((community) => {
		communityGauge.set(
			{
				id: community.item.id,
				name: community.item.name,
				contact: community.item.contact,
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
