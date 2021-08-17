import { getModelForClass, modelOptions, pre, prop, Ref } from "@typegoose/typegoose"
import database from "../database.js"
import { getUserStringFromID } from "../../utils/functions-databaseless.js"
import { CommunityClass } from "./community.js"

const connection = database.connections.find((connection) => connection?.n === "fagc")?.c

@modelOptions({
	schemaOptions: {
		collection: "users"
	},
	existingMongoose: connection
})
@pre<UserClass>("save", function (next) {
	this.id = getUserStringFromID(this._id.toString())
	next()
})
export class UserClass {
	@prop()
	discordUserId!: string

	@prop()
	discordUserTag!: string

	@prop()
	discordGuildId?: string

	@prop({ ref: () => CommunityClass })
	communityId?: Ref<CommunityClass>

	@prop({ default: false })
	hasApiAccess!: boolean
}

const UserModel = getModelForClass(UserClass)
export default UserModel