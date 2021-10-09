import {
	getModelForClass,
	modelOptions,
	Passthrough,
	prop,
} from "@typegoose/typegoose"
import database from "../database.js"

const connection = database.connections.find(
	(connection) => connection?.n === "bot"
)?.c

// the thing from https://github.com/oof2win2/fagc-discord-bot/blob/dev/src/database/schemas/config.js

class Roles {
	reports!: string
	webhooks!: string
	setConfig!: string
	setRules!: string
	setCommunities!: string
}

@modelOptions({
	schemaOptions: {
		collection: "configs",
	},
	existingMongoose: connection,
})
export class CommunityConfigClass {
	@prop()
	communityId?: string

	@prop()
	guildId!: string

	@prop()
	apikey?: string

	@prop({ type: [String] })
	trustedCommunities?: string[]

	@prop({ type: [String] })
	ruleFilters?: string[]

	@prop({
		type: () =>
			new Passthrough({
				reports: String,
				webhooks: String,
				setConfig: String,
				setRules: String,
				setCommunities: String,
			}),
	})
	roles!: Roles
}

const CommunityConfigModel = getModelForClass(CommunityConfigClass)
export default CommunityConfigModel
