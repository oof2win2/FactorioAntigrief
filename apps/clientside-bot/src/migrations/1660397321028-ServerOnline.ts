import { MigrationInterface, QueryRunner } from "typeorm"

export class ServerOnline1660397321028 implements MigrationInterface {
	name = "ServerOnline1660397321028"

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "ServerOnline" ("name" text(32) PRIMARY KEY NOT NULL, "lastOnline" datetime NOT NULL)`
		)
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE "ServerOnline"`)
	}
}
