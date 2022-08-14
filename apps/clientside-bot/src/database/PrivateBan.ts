import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	CreateDateColumn,
} from "typeorm"

@Entity({ name: "PrivateBan" })
export default class PrivateBan {
	@PrimaryGeneratedColumn("increment")
	id!: number

	@Column({
		type: "text",
		length: 32, // length of a Discord snowflake
	})
	adminId!: string

	@Column({
		type: "text",
		length: 60, // https://wiki.factorio.com/Multiplayer#Version_history
	})
	playername!: string

	@Column({
		length: 200, // estimated max reason length
		type: "text",
		nullable: true,
	})
	reason!: string | null

	@CreateDateColumn()
	createdAt!: Date

	@Column({
		type: "datetime",
		nullable: true,
		default: null,
	})
	removedAt: Date | null = null
}
