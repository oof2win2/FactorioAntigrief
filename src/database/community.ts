import { getModelForClass, modelOptions, pre, prop } from "@typegoose/typegoose"
import { getUserStringFromID } from "../utils/functions-databaseless"
import { IdType } from "./ids"

@modelOptions({
	schemaOptions: {
		collection: "communities",
	},
})
@pre<CommunityClass>("save", async function (next) {
	const id = await getUserStringFromID(IdType.COMMUNITY)
	this.id = id.id
	this._id = id._id
	next()
})
export class CommunityClass {
	@prop({ _id: false, unique: true })
		id!: string

	@prop()
		name!: string

	@prop()
		contact!: string

	@prop({ type: [ String ] })
		guildIds!: string[]
}

const CommunityModel = getModelForClass(CommunityClass)
export default CommunityModel
