import { getModelForClass, modelOptions, pre, prop } from "@typegoose/typegoose"
import { getUserStringFromID } from "../utils/functions-databaseless"
import IdModel, { IdType } from "./ids"

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
	@prop({ unique: true })
		id!: string

	@prop()
		name!: string

	@prop()
		contact!: string

	@prop({ type: [ String ] })
		guildIds!: string[]
}

const CommunityModel = getModelForClass(CommunityClass)

const watcher = CommunityModel.watch()
watcher.on("change", async (change) => {
	if (change.operationType === "delete") {
		// delete the ID from the db too
		IdModel.deleteOne({
			_id: (change.documentKey as any)._id, // guaranteed to be present when the operation is "delete"
		}).exec()
	}
})

export default CommunityModel
