import { Entity, Column, PrimaryColumn, CreateDateColumn } from "typeorm"

@Entity({ name: "FAGCBan" })
export default class FAGCBan {
	@PrimaryColumn({
		type: "text",
		length: 6, // length of a FAGC ID
	})
	id!: string

	@Column({
		type: "text",
		length: 60, // https://wiki.factorio.com/Multiplayer#Version_history
	})
	playername!: string

	@Column({
		type: "text",
		length: 6, // length of a FAGC ID
	})
	categoryId!: string

	@Column({
		type: "text",
		length: 6, // length of a FAGC ID
	})
	communityId!: string

	@CreateDateColumn()
	createdAt!: Date

	@Column({
		type: "datetime",
		nullable: true,
		default: null,
	})
	removedAt: Date | null = null
}
