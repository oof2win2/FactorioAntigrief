import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from "typeorm"
import ENV from "../utils/env"

@Entity()
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
		type: "datetime",
		default: () => new Date(),
	})
	lastNotificationProcessed!: Date

	@Column({
		type: "simple-enum",
		enum: ["none", "ban", "custom"],
	})
	reportAction!: "none" | "ban" | "custom"

	@Column({
		type: "simple-enum",
		enum: ["none", "unban", "custom"],
	})
	revocationAction!: "none" | "unban" | "custom"
}
