import { getModelForClass, modelOptions, pre, prop } from "@typegoose/typegoose"
import database from "../database"
import { getUserStringFromID } from "../../utils/functions-databaseless"
const connection = database.connections.find((connection) => connection.n === "fagc").c


@modelOptions({
	schemaOptions: {
		collection: "revocations"
	}
})
@pre<RevocationClass>("save", function(next) {
	this.id = getUserStringFromID(this._id.toString())
	next()
})
export class RevocationClass {
	@prop()
	id: string
	
	@prop()
	reportId: string
	
	@prop()
	playername: string
	
	@prop()
	adminId: string
	
	@prop()
	communityId: string
	
	@prop()
	brokenRule: string
	
	@prop()
	proof: string
	
	@prop()
	description: string
	
	@prop()
	automated: Boolean
	
	@prop()
	reportedTime: Date
	
	@prop()
	revokedTime: Date
	
	@prop()
	revokedBy: string
}

const RevocationModel = getModelForClass(RevocationClass)
export default RevocationModel