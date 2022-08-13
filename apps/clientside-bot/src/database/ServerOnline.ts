import { Entity, Column, PrimaryColumn } from "typeorm"

@Entity({ name: "ServerOnline" })
export default class ServerOnline {
	@PrimaryColumn({
		type: "text",
		length: 32,
	})
	name!: string

	@Column({
		type: "datetime",
	})
	lastOnline!: Date
}
