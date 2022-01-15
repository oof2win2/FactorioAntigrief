import { getModelForClass, modelOptions, pre, prop } from "@typegoose/typegoose"
import { getUserStringFromID } from "../utils/functions-databaseless"
import { IdType } from "./ids"

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
	@prop({ _id: false })
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
export default ReportModel
