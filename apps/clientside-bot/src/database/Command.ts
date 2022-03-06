import { Entity, Column, PrimaryColumn } from "typeorm"

@Entity()
export default class Command {
	@PrimaryColumn({
		length: 32, // length of a Discord snowflake
		type: "text",
	})
	id!: string

	@Column({
		length: 32, // length of a Discord snowflake
		type: "text",
	})
	guildId!: string

	@Column({
		length: 32, // hopefully max length of a command name
		type: "text",
	})
	name!: string
}
