import { MigrationInterface, QueryRunner } from "typeorm"

export class BaseBot1660396948330 implements MigrationInterface {
	name = "BaseBot1660396948330"

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "BotConfig" ("guildId" text(32) PRIMARY KEY NOT NULL, "owner" text(32) NOT NULL DEFAULT ('429696038266208258'), "apikey" text(200), "lastNotificationProcessed" text(24) NOT NULL, "reportAction" varchar CHECK( "reportAction" IN ('none','ban','custom') ) NOT NULL DEFAULT ('none'), "revocationAction" varchar CHECK( "revocationAction" IN ('none','unban','custom') ) NOT NULL DEFAULT ('none'))`
		)
		await queryRunner.query(
			`CREATE TABLE "FAGCBan" ("id" text(6) PRIMARY KEY NOT NULL, "playername" text(60) NOT NULL, "categoryId" text(6) NOT NULL, "communityId" text(6) NOT NULL)`
		)
		await queryRunner.query(
			`CREATE TABLE "InfoChannel" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "channelId" text(32) NOT NULL, "guildId" text(32) NOT NULL)`
		)
		await queryRunner.query(
			`CREATE TABLE "PrivateBan" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "adminId" text(32) NOT NULL, "playername" text(60) NOT NULL, "reason" text(200), "createdAt" datetime NOT NULL DEFAULT (datetime('now')))`
		)
		await queryRunner.query(
			`CREATE TABLE "Whitelist" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "adminId" text(32) NOT NULL, "playername" text(60) NOT NULL, "reason" text(200), "createdAt" datetime NOT NULL DEFAULT (datetime('now')))`
		)
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE "Whitelist"`)
		await queryRunner.query(`DROP TABLE "PrivateBan"`)
		await queryRunner.query(`DROP TABLE "InfoChannel"`)
		await queryRunner.query(`DROP TABLE "FAGCBan"`)
		await queryRunner.query(`DROP TABLE "BotConfig"`)
	}
}
