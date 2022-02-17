import {
	getModelForClass,
	modelOptions,
	Passthrough,
	prop,
} from "@typegoose/typegoose"

// the thing from https://github.com/oof2win2/fagc-discord-bot/blob/dev/src/database/schemas/config.js

class Roles {
	reports!: string
	webhooks!: string
	setConfig!: string
	setCategories!: string
	setCommunities!: string
}

@modelOptions({
	schemaOptions: {
		collection: "guildconfigs",
		toObject: {
			transform(_doc, ret, options) {
				if (!options.includeApikey) {
					delete ret.apikey
				}
			},
		},
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
				setCategories: String,
				setCommunities: String,
			}),
		default: {
			reports: "",
			webhooks: "",
			setConfig: "",
			setCategories: "",
			setCommunities: "",
		},
	})
	roles!: Roles

	@prop({ type: [String], default: [] })
	trustedCommunities!: string[]

	@prop({ type: [String], default: [] })
	categoryFilters!: string[]
}

const GuildConfigModel = getModelForClass(GuildConfigClass)
export default GuildConfigModel
