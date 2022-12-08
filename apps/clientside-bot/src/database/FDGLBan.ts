import { Entity, Column, PrimaryColumn, CreateDateColumn } from "typeorm"

@Entity({ name: "FDGLBan" })
export default class FDGLBan {
	@PrimaryColumn({
		type: "text",
		length: 6, // length of a FDGL ID
	})
	id!: string

	@Column({
		type: "text",
		length: 60, // https://wiki.factorio.com/Multiplayer#Version_history
	})
	playername!: string

	@Column({
		type: "text",
		length: 6, // length of a FDGL ID
	})
	categoryId!: string

	@Column({
		type: "text",
		length: 6, // length of a FDGL ID
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
