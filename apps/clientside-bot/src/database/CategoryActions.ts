import { Entity, Column, PrimaryColumn } from "typeorm"

@Entity({ name: "FDGLCategoryActions" })
export default class CategoryActions {
	@PrimaryColumn({
		type: "text",
		length: 6, // length of a FDGL ID
	})
	id!: string

	@Column({
		type: "integer",
		default: 0,
	})
	createOptions!: number

	@Column({
		type: "integer",
		default: 0,
	})
	revokeOptions!: number

	@Column({
		type: "text",
		nullable: true,
		default: null,
	})
	createCustomCommand!: string | null

	@Column({
		type: "text",
		nullable: true,
		default: null,
	})
	revokeCustomCommand!: string | null
}
