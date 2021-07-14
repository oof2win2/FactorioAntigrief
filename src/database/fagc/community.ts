import { getModelForClass, modelOptions, pre, prop, Ref } from "@typegoose/typegoose"
import database from "../database"
import { getUserStringFromID } from "../../utils/functions-databaseless"

const connection = database.connections.find((connection) => connection.n === "fagc").c

export class CommunityClass {
	@prop()
	id: String

	@prop()
	name: String

	@prop()
	contact: String

	@prop()
	guildId: String
}

const CommunityModel = getModelForClass(CommunityClass)
export default CommunityModel