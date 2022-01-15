import { getModelForClass, modelOptions, pre, prop } from "@typegoose/typegoose"
import { getUserStringFromID } from "../utils/functions-databaseless"
import IdModel, { IdType } from "./ids"

@modelOptions({
	schemaOptions: {
		collection: "reports",
	},
})
@pre<ReportClass>("save", async function (next) {
	const id = await getUserStringFromID(IdType.REPORT)
	this.id = id.id
	this._id = id._id
	this.createdAt = this.createdAt || new Date()
	next()
})
export class ReportClass {
	@prop({ _id: false, unique: true })
		id!: string

	@prop()
		playername!: string

	@prop()
		communityId!: string

	@prop()
		brokenRule!: string

	@prop()
		proof!: string

	@prop()
		description!: string

	@prop()
		automated!: boolean

	@prop()
		reportedTime!: Date

	@prop()
		adminId!: string

	@prop()
		createdAt!: Date
}

const ReportModel = getModelForClass(ReportClass)

const watcher = ReportModel.watch()
watcher.on("change", async (change) => {
	if (change.operationType === "delete") {
		// delete the ID from the db too
		IdModel.deleteOne({
			_id: (change.documentKey as any)._id, // guaranteed to be present when the operation is "delete"
		}).exec()
	}
})

export default ReportModel
