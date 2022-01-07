import {
	getModelForClass,
	modelOptions,
	pre,
	prop,
} from "@typegoose/typegoose"
import { Ref } from "@typegoose/typegoose"
import { getUserStringFromID } from "../../utils/functions-databaseless.js"

@modelOptions({
	schemaOptions: {
		collection: "apiaccess",
	},
})
@pre<ApiAccessClass>("save", function (next) {
	this.id = getUserStringFromID(this._id.toString())
	next()
})
export class ApiAccessClass {
	@prop()
		communityId!: string
	@prop()
		discordUserId!: string
	@prop()
		discordGuildId!: string
	@prop({ default: false })
		reports!: boolean
	@prop({ default: false })
		config!: boolean
	@prop({ default: false })
		notifications!: boolean
}
export const ApiAccessModel = getModelForClass(ApiAccessClass)

@modelOptions({
	schemaOptions: {
		collection: "userauth",
	},
})
@pre<UserAuthClass>("save", function (next) {
	this.id = getUserStringFromID(this._id.toString())
	next()
})
export class UserAuthClass {
	@prop({ required: true })
		discordUserId!: string

	@prop({ required: true })
		access_token!: string

	@prop({ required: true })
		expires_at!: Date

	@prop({ required: true })
		refresh_token!: string
}
export const UserAuthModel = getModelForClass(UserAuthClass)

@modelOptions({
	schemaOptions: {
		collection: "users",
	},
})
@pre<UserClass>("save", function (next) {
	this.id = getUserStringFromID(this._id.toString())
	next()
})
export class UserClass {
	@prop({ required: true })
		discordUserId!: string

	@prop({ required: true })
		discordUserTag!: string

	@prop({ default: [], type: [ String ] })
		discordGuildIds!: string[]

	// the list of community ids where the user has api access
	@prop({
		default: [],
		ref: ApiAccessClass,
	})
		apiAccess!: Ref<ApiAccessClass>[]

	@prop({ default: [], type: [ String ] })
		communityOwner!: string[]

	@prop({ ref: () => UserAuthClass, required: true })
		userAuth!: Ref<UserAuthClass>
}

const UserModel = getModelForClass(UserClass)
export default UserModel
