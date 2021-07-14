import { getModelForClass, pre, prop } from "@typegoose/typegoose"
import database from "../database"
import { getUserStringFromID } from "../../utils/functions-databaseless"
const connection = database.connections.find((connection) => connection.n === "fagc").c

@pre<ReportClass>("save", function(next) {
	this.id = getUserStringFromID(this._id.toString())
	next()
})
export class ReportClass {
	@prop()
	id: String

	@prop()
	playername: String

	@prop()
	communityId: String

	@prop()
	brokenRule: String

	@prop()
	proof: String

	@prop()
	description: String

	@prop()
	automated: Boolean

	@prop()
	reportedTime: Date

	@prop()
	adminId: String
}

const ReportModel = getModelForClass(ReportClass)
export default ReportModel