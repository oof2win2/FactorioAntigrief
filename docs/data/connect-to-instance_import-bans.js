const csv = require("csv/sync")
const { FDGLWrapper } = require("@fdgl/api-wrapper")
const fs = require("fs")

const APIKEY = "YOUR FDGL API KEY HERE"
const GUILDID = "YOUR GUILD ID HERE"

const fdgl = new FDGLWrapper({
	apiurl: "https://factoriobans.club",
	apikey: APIKEY,
})

// string of mod:discord id
const mods = {
	BulletToothJake: "498098314689118228",
	hidden_relic: "700745129639805009",
	Loopv: "259851695109046272",
	oof2win2: "429696038266208258",
	Psychodata: "264652399824601088",
	Windsinger: "105005928461438976",
	Zacland34: "261789083880128514",
}

// columns are USERNAME,REASON,RB,CATEGORY 1,CATEGORY 2,CATEGORY 3,DONE,DATE,BY,PROOF,PROOF 2,PROOF 3,PROOF 4,PROOF 5
const input = csv.stringify(csv.parse(fs.readFileSync("./input.csv", "utf8")))
const lines = input.split("\n").slice(1)

const run = async () => {
	const allCategories = await fdgl.categories.fetchAll({})
	const getCategory = (name) => {
		return allCategories.find((c) => c.name === name).id
	}

	let existingGuildConfig = await fdgl.communities.fetchGuildConfig({
		guildId: GUILDID,
	})

	const addCategoryToFilters = async (categoryId) => {
		const newConfig = await fdgl.communities.setGuildConfig({
			config: {
				guildId: GUILDID,
				categoryFilters: [
					...new Set([
						...existingGuildConfig.categoryFilters,
						categoryId,
					]),
				],
			},
		})
		existingGuildConfig = newConfig
	}

	for (const line of lines) {
		const [
			playername,
			reason,
			rb,
			category1,
			category2,
			category3,
			done,
			date,
			by,
			proof1,
			proof2,
			proof3,
			proof4,
			proof5,
		] = line.split(",")
		if (done !== "TRUE") continue
		const adminId = mods[by]

		const categories = []
		if (rb === "TRUE") categories.push(getCategory("Removing Buildings"))
		if (category1) categories.push(getCategory(category1))
		if (category2) categories.push(getCategory(category2))
		if (category3) categories.push(getCategory(category3))

		let proofString = ""
		if (proof1) proofString += proof1.trim()
		if (proof2) proofString += " " + proof2.trim()
		if (proof3) proofString += " " + proof3.trim()
		if (proof4) proofString += " " + proof4.trim()
		if (proof5) proofString += " " + proof5.trim()

		for (const categoryId of categories) {
			if (!existingGuildConfig.categoryFilters.includes(categoryId)) {
				await addCategoryToFilters(categoryId)
				console.log(`Added ${categoryId} to filters`)
				// wait for 1200ms
				await new Promise((resolve) => setTimeout(resolve, 1200))
			}
			await fdgl.reports.create({
				report: {
					playername,
					description: reason,
					categoryId,
					adminId,
					reportedTime: new Date(date),
					proof: proofString || undefined,
				},
			})
			// wait for 1250ms to prevent rate limiting (50 requests/s is max)
			await new Promise((resolve) => setTimeout(resolve, 1250))
		}
	}
	fdgl.destroy()
}
run()
