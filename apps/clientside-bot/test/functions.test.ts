import { createConnection, Connection } from "typeorm"
import { splitIntoGroups } from "../src/utils/functions"
import BotConfig from "../src/database/BotConfig.js"
import Command from "../src/database/Command.js"
import FAGCBan from "../src/database/FAGCBan.js"
import InfoChannel from "../src/database/InfoChannel.js"
import PrivateBan from "../src/database/PrivateBan.js"
import Whitelist from "../src/database/Whitelist.js"
import { createFAGCCategory, createTimes } from "./utils"

describe("splitIntoGroups", () => {
	it("Should split a large array two smaller ones of an equal size", () => {
		const items = new Array(1000).fill(0)
		const groups = splitIntoGroups(items, 500)
		expect(groups.length).toBe(2)
		expect(groups[0].length).toBe(500)
		expect(groups[1].length).toBe(500)
	})
	it("Should split a large array into multiple smaller ones if a smaller maxSize is provided", () => {
		const items = new Array(1000).fill(0)
		const groups = splitIntoGroups(items, 100)
		expect(groups.length).toBe(10)
		for (const group of groups) {
			expect(group.length).toBe(100)
		}
	})
	it("Should keep the original values of the inital array", () => {
		const items = Array.from({ length: 1000 }, () =>
			Math.floor(Math.random() * 10)
		)
		const groups = splitIntoGroups(items, 100)
		expect(groups.flat()).toEqual(items)
	})
})

describe("guildConfigChangedBanlists", () => {
	let database: Connection
	beforeEach(async () => {
		database = await createConnection({
			type: "better-sqlite3",
			database: ":memory:",
			entities: [
				FAGCBan,
				InfoChannel,
				BotConfig,
				PrivateBan,
				Whitelist,
				Command,
			],
			synchronize: true,
		})
	})
	it("Should create bans for people that have none", async () => {
		// remove any pre-existing bans, privatebans and whitelists
		await database
			.getRepository(FAGCBan)
			.createQueryBuilder()
			.delete()
			.execute()
		await database
			.getRepository(PrivateBan)
			.createQueryBuilder()
			.delete()
			.execute()
		await database
			.getRepository(Whitelist)
			.createQueryBuilder()
			.delete()
			.execute()
	})

	const rules = createTimes(createFAGCCategory, 1000)
	const communities = createTimes(createFAGCCategory, 1000)
})
