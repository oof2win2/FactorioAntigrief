import diffTakenActions from "../../src/utils/functions/diffTakenActions"
import {
	createFDGLBan,
	createFDGLCategory,
	createFDGLCommunity,
	createTimes,
	randomElementFromArray,
	randomElementsFromArray,
} from "../utils"
import faker from "faker"

describe("checkTakenActions", () => {
	const categories = createTimes(createFDGLCategory, 25)
	const communities = createTimes(createFDGLCommunity, 25)
	const actions = createTimes(faker.datatype.string, 10) // 10 random action IDs
	const actionMap = new Map<string, string>() // map of category IDs to action IDs
	for (const category of categories) {
		if (Math.random() < 0.3) continue // 30% of categories will not have actions
		actionMap.set(category.id, randomElementFromArray(actions))
	}

	it("Should return no changes if the reports are the same before and after", () => {
		const reports = createTimes(
			createFDGLBan,
			[
				{
					categoryIds: categories.map((c) => c.id),
					communityIds: communities.map((c) => c.id),
					createdAt: faker.date.past(),
				},
			],
			25
		)

		// it should return no changes if there aren't any reports before or after
		const emptyChanges = diffTakenActions(actionMap, [], [])
		expect(emptyChanges.actionsToTake).toHaveLength(0)
		expect(emptyChanges.actionsToRevoke).toHaveLength(0)
		expect(emptyChanges.actionsToRetake).toHaveLength(0)

		// it should return no changes if the reports are the same before and after
		const sameChanges = diffTakenActions(actionMap, reports, reports)
		expect(sameChanges.actionsToTake).toHaveLength(0)
		expect(sameChanges.actionsToRevoke).toHaveLength(0)
		expect(sameChanges.actionsToRetake).toHaveLength(0)
	})

	it("Should return that actions should be taken if there are new reports", () => {
		const reports = createTimes(
			createFDGLBan,
			[
				{
					categoryIds: categories.map((c) => c.id),
					communityIds: communities.map((c) => c.id),
					createdAt: new Date(0),
				},
			],
			5
		)
		const additional = createTimes(
			createFDGLBan,
			[
				{
					categoryIds: categories.map((c) => c.id),
					communityIds: communities.map((c) => c.id),
					createdAt: new Date(0),
				},
			],
			5
		)

		// it should return that actions should be taken if there are new reports
		const newReports = [...reports, ...additional]

		const previousActions = new Set(
			reports
				.map((report) => actionMap.get(report.categoryId))
				.filter((x): x is string => Boolean(x))
		)
		const newActions = new Set(
			newReports
				.map((report) => actionMap.get(report.categoryId))
				.filter((x): x is string => Boolean(x))
		)

		const newChanges = diffTakenActions(actionMap, reports, newReports)
		expect(newChanges.actionsToTake).toHaveLength(
			newActions.size - previousActions.size
		)
		expect(newChanges.actionsToRevoke).toHaveLength(0)
		expect(newChanges.actionsToRetake).toHaveLength(0)

		// ensure that the actions to take are the ones that were supposed to be taken
		for (const action of newChanges.actionsToTake) {
			expect(newActions).toContain(action)
			expect(previousActions).not.toContain(action)
		}
	})

	it("Should return that actions should be revoked if reports are removed", () => {
		const reports = createTimes(
			createFDGLBan,
			[
				{
					categoryIds: categories.map((c) => c.id),
					communityIds: communities.map((c) => c.id),
					createdAt: faker.date.past(),
				},
			],
			25
		)
		const reportsAfter = randomElementsFromArray(reports, 5)

		const previousActions = new Set(
			reports
				.map((report) => actionMap.get(report.categoryId))
				.filter((x): x is string => Boolean(x))
		)
		const actionsAfter = new Set(
			reportsAfter
				.map((report) => actionMap.get(report.categoryId))
				.filter((x): x is string => Boolean(x))
		)
		console.log(previousActions, actionsAfter)

		// it should return that actions should be revoked if reports are removed
		const newChanges = diffTakenActions(actionMap, reports, reportsAfter)
		expect(newChanges.actionsToTake).toHaveLength(0)
		expect(newChanges.actionsToRevoke).toHaveLength(
			previousActions.size - actionsAfter.size
		)
		expect(newChanges.actionsToRetake).toHaveLength(0)

		// ensure that the actions to revoke are the ones that were supposed to be revoked
		for (const action of newChanges.actionsToRevoke) {
			expect(previousActions).toContain(action)
			expect(actionsAfter).not.toContain(action)
		}
	})

	it("Should return that actions should be retaken if reports are updated", () => {
		// TODO: implement this test
	})
})
