import { getModelForClass, modelOptions, pre, prop } from "@typegoose/typegoose"
import { createUniqueId } from "../utils/functions-databaseless"

@modelOptions({
	schemaOptions: {
		collection: "filterobject",
	},
})
@pre<FilterClass>("save", async function (next) {
	if (!this.id || !this._id) {
		const id = await createUniqueId(FilterModel)
		this.id = id
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

export default FilterModel
