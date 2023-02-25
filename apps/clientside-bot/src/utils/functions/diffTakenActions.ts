import FDGLBan from "../../database/FDGLBan"

/**
 * Create a "diff" of the taken actions, taking into account the previous reports. Assumes that the reports
 * are all for the same player.
 *
 * Ensures that an action will be re-done if the previous report that triggered it was removed
 *
 * The report used to trigger an action is the oldest valid report for that category
 *
 *
 * @param actions Configured map of category IDs to action IDs
 * @param prevReports The reports that were valid before the change
 * @param newReports The reports that are valid after the change
 */
const diffTakenActions = (
	actions: Map<string, string>,
	prevReports: FDGLBan[],
	newReports: FDGLBan[]
) => {
	const prevSorted = prevReports.sort(
		(a, b) => a.createdAt.getTime() - b.createdAt.getTime()
	)
	const newSorted = newReports.sort(
		(a, b) => a.createdAt.getTime() - b.createdAt.getTime()
	)

	// get the IDs of the actions that were taken before, store the report that triggered them
	const prevActions = new Map<string, string>()
	for (const report of prevSorted) {
		const action = actions.get(report.categoryId)
		if (!action) continue // there is no action to be taken for this category
		if (prevActions.has(action)) continue // the action was already taken by a previous report
		prevActions.set(action, report.id)
	}
	// now we do the same for the new reports
	const newActions = new Map<string, string>()
	for (const report of newSorted) {
		const action = actions.get(report.categoryId)
		if (!action) continue // there is no action to be taken for this category
		if (newActions.has(action)) continue // the action was already taken by a previous report
		newActions.set(action, report.id)
	}

	const actionsToTake: string[] = []
	const actionsToRevoke: string[] = []
	const actionsToRetake: string[] = []

	const uniqueActions = new Set(actions.values())

	// now we iterate over each action available to us and check what we should do
	for (const actionId of uniqueActions) {
		// if the action wasn't taken before and isn't taken now, we don't do anything
		if (!prevActions.has(actionId) && !newActions.has(actionId)) continue

		// if the report that triggered the action was the same before and after, we don't do anything
		if (prevActions.get(actionId) === newActions.get(actionId)) continue

		// if the action was taken before and isn't taken now, we revoke it
		if (prevActions.has(actionId) && !newActions.has(actionId)) {
			actionsToRevoke.push(actionId)
			continue
		}

		// if the action wasn't taken before and is taken now, we take it
		if (!prevActions.has(actionId) && newActions.has(actionId)) {
			actionsToTake.push(actionId)
			continue
		}

		// the last case is that the action was taken before and is taken now, but the report that triggered it
		// was different, so we retake it
		actionsToRetake.push(actionId)
	}

	console.log(actionsToTake, actionsToRevoke, actionsToRetake)

	return {
		actionsToTake,
		actionsToRevoke,
		actionsToRetake,
	}
}

export default diffTakenActions
