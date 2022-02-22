import { Entity, Column, PrimaryColumn } from "typeorm"

@Entity()
export default class FAGCBan {
	@PrimaryColumn({
		type: "text",
		length: 6, // length of a FAGC ID
	})
	id!: string

	@Column({
		type: "text",
		length: 32, // hopefully max length of a playername
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
}
