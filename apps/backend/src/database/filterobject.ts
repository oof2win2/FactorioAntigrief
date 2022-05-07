import { getModelForClass, modelOptions, pre, prop } from "@typegoose/typegoose"
import { getUserStringFromId } from "../utils/functions-databaseless"
import IdModel, { IdType } from "./ids"

@modelOptions({
	schemaOptions: {
		collection: "categories",
	},
})
@pre<FilterClass>("save", async function (next) {
	if (!this.id || !this._id) {
		const id = await getUserStringFromId(IdType.FILTER)
		this.id = id.id
		this._id = id._id
	}
	next()
})
export class FilterClass {
	@prop({ unique: true })
	id!: string

	@prop({ type: [String], default: [] })
	categoryFilters!: string[]

	@prop({ type: [String], default: [] })
	communityFilters!: string[]
}

const FilterModel = getModelForClass(FilterClass)

export const watcher = FilterModel.watch()
watcher.on("change", async (change) => {
	if (change.operationType === "delete") {
		// delete the ID from the db too
		IdModel.deleteOne({
			_id: (change.documentKey as any)._id, // guaranteed to be present when the operation is "delete"
		}).exec()
	}
})

export default FilterModel
