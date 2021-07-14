import { getModelForClass, pre, prop } from "@typegoose/typegoose"
import database from "../database"
import { getUserStringFromID } from "../../utils/functions-databaseless"
const connection = database.connections.find((connection) => connection.n === "fagc").c

@pre<RuleClass>("save", function(next) {
	this.id = getUserStringFromID(this._id.toString())
	next()
})
export class RuleClass {
	@prop()
	id: String
	
	@prop()
	shortdesc: String
	
	@prop()
	longdesc: String
}

const RuleModel = getModelForClass(RuleClass)
export default RuleModel