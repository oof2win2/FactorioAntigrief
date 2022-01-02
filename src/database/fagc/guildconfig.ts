import typegoose from "@typegoose/typegoose"
const {
	getModelForClass,
	modelOptions,
	Passthrough,
	prop,
} = typegoose

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
		collection: "guildconfigs",
	},
})
export class GuildConfigClass {
	@prop()
		communityId?: string

	@prop()
		guildId!: string

	@prop()
		apikey?: string

	@prop({
		type: () =>
			new Passthrough({
				reports: String,
				webhooks: String,
				setConfig: String,
				setRules: String,
				setCommunities: String,
			}),
		default: {
			reports: "",
			webhooks: "",
			setConfig: "",
			setRules: "",
			setCommunities: "",
		}
	})
		roles!: Roles

	@prop({ type: [ String ], default: [] })
		trustedCommunities!: string[]

	@prop({ type: [ String ], default: [] })
		ruleFilters!: string[]
}

const GuildConfigModel = getModelForClass(GuildConfigClass)
export default GuildConfigModel
