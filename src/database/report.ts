import { getModelForClass, modelOptions, pre, prop } from "@typegoose/typegoose"
import { getUserStringFromID } from "../utils/functions-databaseless"

@modelOptions({
	schemaOptions: {
		collection: "reports",
	},
})
@pre<ReportClass>("save", function (next) {
	this.id = getUserStringFromID(this._id.toString())
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
