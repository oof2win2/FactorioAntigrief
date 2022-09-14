import { FactorioServerType } from "../../src/base/database"
import ServerSyncedActionHandler from "../../src/base/ServerReadHandler"

describe("ServerSyncedActionHandler", () => {
	const server: FactorioServerType = {
		servername: "test",
		discordGuildId: "123",
		discordChannelId: "123",
		rconPort: 0,
		rconPassword: "",
		gatherActions: true,
		actionFilePath: "script-output/fagc-actions.txt",
		absoluteServerPath: "/home/factorio/servers/test",
	}
	const handler = new ServerSyncedActionHandler([])

	beforeAll(() => {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		jest.spyOn(global.console, "error").mockImplementation(() => {})
	})

	afterAll(() => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		global.console.error.mockRestore()
	})

	it("Should error with invalid action type", () => {
		expect(handler.handleLine(server, "some invalid test line")).toBe(false)
		expect(console.error).toBeCalled()
	})

	it("Should error with invalid ban line format", () => {
		expect(handler.handleLine(server, `ban;;"Player";`)).toBe(false)
		expect(console.error).toBeCalled()
	})

	it("Should succeed with valid ban line format without a reason", () => {
		const result = handler.handleLine(
			server,
			`ban;"oof2win2";"Windsinger";`
		)

		expect(result).not.toBe(false)
		expect((result as Exclude<typeof result, false>).actionType).toBe("ban")
		expect(
			(result as Exclude<typeof result, false>).action.playername
		).toBe("oof2win2")
		expect((result as Exclude<typeof result, false>).action.byPlayer).toBe(
			"Windsinger"
		)
		expect((result as Exclude<typeof result, false>).action.reason).toBe("")
	})

	it("Should succeed with valid ban line format with a reason", () => {
		const result = handler.handleLine(
			server,
			`ban;"oof2win2";"Windsinger";"Some reason"`
		)

		expect(result).not.toBe(false)
		expect((result as Exclude<typeof result, false>).actionType).toBe("ban")
		expect(
			(result as Exclude<typeof result, false>).action.playername
		).toBe("oof2win2")
		expect((result as Exclude<typeof result, false>).action.byPlayer).toBe(
			"Windsinger"
		)
		expect((result as Exclude<typeof result, false>).action.reason).toBe(
			"Some reason"
		)
	})

	it("Should error with invalid unban line format", () => {
		expect(handler.handleLine(server, `unban;;"Player";`)).toBe(false)
		expect(console.error).toBeCalled()
	})

	it("Should succeed with valid unban line format without a reason", () => {
		const result = handler.handleLine(
			server,
			`unban;"oof2win2";"Windsinger";`
		)

		expect(result).not.toBe(false)
		expect((result as Exclude<typeof result, false>).actionType).toBe(
			"unban"
		)
		expect(
			(result as Exclude<typeof result, false>).action.playername
		).toBe("oof2win2")
		expect((result as Exclude<typeof result, false>).action.byPlayer).toBe(
			"Windsinger"
		)
		expect((result as Exclude<typeof result, false>).action.reason).toBe("")
	})

	it("Should succeed with valid unban line format with a reason", () => {
		const result = handler.handleLine(
			server,
			`unban;"oof2win2";"Windsinger";"Some reason"`
		)

		expect(result).not.toBe(false)
		expect((result as Exclude<typeof result, false>).actionType).toBe(
			"unban"
		)
		expect(
			(result as Exclude<typeof result, false>).action.playername
		).toBe("oof2win2")
		expect((result as Exclude<typeof result, false>).action.byPlayer).toBe(
			"Windsinger"
		)
		expect((result as Exclude<typeof result, false>).action.reason).toBe(
			"Some reason"
		)
	})
})
