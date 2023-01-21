import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	CreateDateColumn,
} from "typeorm"

@Entity({ name: "ActionLog" })
export default class ActionLog {
	@PrimaryGeneratedColumn("increment")
	id!: number

	@CreateDateColumn()
	createdAt!: Date

	@Column({
		type: "text",
		length: 64, // length of a Discord snowflake
	})
	command!: string
}
