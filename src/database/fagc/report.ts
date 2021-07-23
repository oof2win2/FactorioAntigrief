import { getModelForClass, modelOptions, pre, prop } from "@typegoose/typegoose"
import database from "../database"
import { getUserStringFromID } from "../../utils/functions-databaseless"

const connection = database.connections.find((connection) => connection?.n === "fagc")?.c

@modelOptions({
	schemaOptions: {
		collection: "reports"
	},
	existingMongoose: connection
})
@pre<ReportClass>("save", function(next) {
	this.id = getUserStringFromID(this._id.toString())
	next()
})
export class ReportClass {
	@prop({_id: false})
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
}

const ReportModel = getModelForClass(ReportClass)
export default ReportModel