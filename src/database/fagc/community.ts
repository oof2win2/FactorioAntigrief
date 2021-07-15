import { getModelForClass, modelOptions, pre, prop, Ref } from "@typegoose/typegoose"
import database from "../database"
import { getUserStringFromID } from "../../utils/functions-databaseless"

// const connection = database.connections.find((connection) => connection.n === "fagc").c

@modelOptions({
	schemaOptions: {
		collection: "communities"
	}
})
@pre<CommunityClass>("save", function (next) {
	this.id = getUserStringFromID(this._id.toString())
	next()
})
export class CommunityClass {
	@prop({ _id: false })
	id!: string

	@prop()
	name!: string

	@prop()
	contact!: string

	@prop()
	guildId!: string
}

const CommunityModel = getModelForClass(CommunityClass)
export default CommunityModel