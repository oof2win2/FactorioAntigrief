import { Entity, Column, PrimaryColumn } from "typeorm"

@Entity({ name: "LinkedAdmin" })
export default class LinkedAdmin {
	@PrimaryColumn({
		length: 32, // length of a Discord snowflake
		type: "text",
	})
	discordId!: string

	@Column({
		type: "text",
		length: 60, // https://wiki.factorio.com/Multiplayer#Version_history
	})
	playername!: string
}
