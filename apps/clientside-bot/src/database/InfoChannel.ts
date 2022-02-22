import { Entity, Column, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export default class InfoChannel {
	@PrimaryGeneratedColumn("increment")
	id!: number

	@Column({
		length: 32, // length of a Discord snowflake
		type: "text",
	})
	channelId!: string

	@Column({
		length: 32, // length of a Discord snowflake
		type: "text",
	})
	guildId!: string
}
