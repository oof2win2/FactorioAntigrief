import { getModelForClass, modelOptions, pre, prop } from "@typegoose/typegoose"
import { getUserStringFromId } from "../utils/functions-databaseless"
import IdModel, { IdType } from "./ids"

@modelOptions({
	schemaOptions: {
		collection: "categories",
	},
})
@pre<CategoryClass>("save", async function (next) {
	if (!this.id || !this._id) {
		const id = await getUserStringFromId(IdType.COMMUNITY)
		this.id = id.id
		this._id = id._id
	}
	next()
})
export class CategoryClass {
	@prop({ unique: true })
	id!: string

	@prop()
	name!: string

	@prop()
	description!: string
}

const CategoryModel = getModelForClass(CategoryClass)

export const watcher = CategoryModel.watch()
watcher.on("change", async (change) => {
	if (change.operationType === "delete") {
		// delete the ID from the db too
		IdModel.deleteOne({
			_id: (change.documentKey as any)._id, // guaranteed to be present when the operation is "delete"
		}).exec()
	}
})

export default CategoryModel
