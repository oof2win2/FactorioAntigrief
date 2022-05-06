import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose"

@modelOptions({
	schemaOptions: {
		collection: "users",
	},
})
export class UserClass {
	@prop({ unique: true })
	id!: string // discord user id

	@prop()
	tag!: string // discord username#tag

	@prop()
	refreshToken!: string // discord refresh token

	@prop()
	accessToken!: string // discord access token

	@prop()
	expiresAt!: Date // discord access token expiration
}

const UserModel = getModelForClass(UserClass)

export default UserModel
