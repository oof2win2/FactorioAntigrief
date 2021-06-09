-- CreateTable
CREATE TABLE "GuildConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "onViolation" TEXT NOT NULL DEFAULT 'info',
    "onRevocation" TEXT NOT NULL DEFAULT 'info',
    "banRole" TEXT,
    "configRole" TEXT,
    "notificationsRole" TEXT,
    "guildId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "InfoChannels" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "channelid" TEXT NOT NULL,
    "configid" INTEGER NOT NULL,
    FOREIGN KEY ("configid") REFERENCES "GuildConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PrivateBans" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bannedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "playername" TEXT NOT NULL,
    "reason" TEXT DEFAULT 'No reason',
    "admin" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Syncedbans" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bannedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "apiId" TEXT NOT NULL,
    "playername" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "admin" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Whitelist" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "playername" TEXT NOT NULL,
    "whitelistedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "whitelistedBy" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Syncedbans.apiId_unique" ON "Syncedbans"("apiId");
