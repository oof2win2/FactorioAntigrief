import { getModelForClass, modelOptions, pre, prop } from "@typegoose/typegoose"
import { createUniqueId } from "../utils/functions-databaseless"

@modelOptions({
	schemaOptions: {
		collection: "communities",
	},
})
@pre<CommunityClass>("save", async function (next) {
	if (!this.id || !this._id) {
		const id = await createUniqueId(CommunityModel)
		this.id = id
	}
	next()
})
export class CommunityClass {
	@prop({ unique: true })
	id!: string

	@prop()
	name!: string

	@prop()
	contact!: string

	@prop({ type: [String] })
	guildIds!: string[]

	@prop({ type: Date, default: new Date(0) })
	tokenInvalidBefore!: Date

	@prop()
	filterObjectId!: string
}

const CommunityModel = getModelForClass(CommunityClass)

export default CommunityModel
