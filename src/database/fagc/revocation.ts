import { getModelForClass, pre, prop } from "@typegoose/typegoose"
import database from "../database"
import { getUserStringFromID } from "../../utils/functions-databaseless"
const connection = database.connections.find((connection) => connection.n === "fagc").c


@pre<RevocationClass>("save", function(next) {
	this.id = getUserStringFromID(this._id.toString())
	next()
})
export class RevocationClass {
	@prop()
	id: String
	
	@prop()
	reportId: String
	
	@prop()
	playername: String
	
	@prop()
	adminId: String
	
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
	revokedTime: Date
	
	@prop()
	revokedBy: String
}

const RevocationModel = getModelForClass(RevocationClass)
export default RevocationModel