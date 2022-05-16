import { getModelForClass, modelOptions, pre, prop } from "@typegoose/typegoose"
import { createUniqueId } from "../utils/functions-databaseless"

@modelOptions({
	schemaOptions: {
		collection: "reports",
	},
})
@pre<ReportInfoClass>("save", async function (next) {
	if (!this.id || !this._id) {
		const id = await createUniqueId(ReportInfoModel)
		this.id = id
	}
	this.reportCreatedAt = this.reportCreatedAt || new Date()
	next()
})
export class ReportInfoClass {
	@prop()
	id!: string

	@prop()
	playername!: string

	@prop()
	communityId!: string

	@prop()
	categoryId!: string

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
	reportCreatedAt!: Date

	// revocation specific stuff. is not there on reports but is on revocations

	@prop()
	revokedBy?: string

	@prop()
	revokedAt?: Date
}

const ReportInfoModel = getModelForClass(ReportInfoClass)
export default ReportInfoModel
