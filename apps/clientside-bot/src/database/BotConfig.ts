import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from "typeorm"
import ENV from "../utils/env"

@Entity({ name: "BotConfig" })
export default class BotConfig {
	@PrimaryColumn({
		length: 32, // length of a Discord snowflake
		type: "text",
	})
	guildId!: string

	@Column({
		length: 32, // length of a Discord snowflake
		type: "text",
		default: ENV.OWNERID,
	})
	owner!: string

	@Column({
		length: 200, // estimated max api key length
		type: "text",
		nullable: true,
	})
	apikey!: string | null

	@Column({
		type: "text",
		length: 24, // max length of a date string
		transformer: {
			// assuming nobody messes with the database, x is always a valid ISO8601 string
			from: (x: string) => new Date(x),
			// if the date is valid, then set it to the ISO string. if it isn't, set it as the current date
			to: (x) =>
				isNaN(new Date(x).valueOf())
					? new Date().toISOString()
					: new Date(x).toISOString(),
		},
	})
	lastNotificationProcessed!: Date

	@Column({
		type: "simple-enum",
		enum: ["none", "ban", "custom"],
		default: "none",
	})
	reportAction!: "none" | "ban" | "custom"

	@Column({
		type: "simple-enum",
		enum: ["none", "unban", "custom"],
		default: "none",
	})
	revocationAction!: "none" | "unban" | "custom"
}
