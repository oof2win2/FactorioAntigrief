import database from "../database"
import { getUserStringFromID } from "../../utils/functions-databaseless"
import { getModelForClass, pre, prop } from "@typegoose/typegoose"
const connection = database.connections.find((connection) => connection.n === "fagc").c


@pre<LogClass>("save", function (next) {
	this.id = getUserStringFromID(this._id.toString())
	next()
})
export class LogClass {
	@prop()
	id: String
	
	@prop()
	timestamp: Date
	
	@prop()
	apikey: String
	
	@prop()
	ip: String
	
	@prop()
	responseBody: Object
	
	@prop()
	requestBody: Object
	
	@prop()
	endpointAddress: String
}
const LogModel = getModelForClass(LogClass)
export default LogModel