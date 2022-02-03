## UNRELEASED

-   Renamed category shortdesc and longdesc fields to name and description

## [1.9.0] - [2022-01-24]

### Changes

-   Renamed report rules to categories.

## [1.8.1] - [2022-01-21]

### Bugfixes

-	 Change `GuildConfig`.`apiKey` field for master API use

## [1.8.0] - [2022-01-20]

### Changes

-	 Add `GuildConfig`.`apiKey` field for master API use

## [1.7.0] - [2022-01-18]

### Changes

-	Add the `Community`.`tokenInvalidBefore` field to represent the date before which the community's tokens are invalid
-	Put the date type union type in one place so it can be easily changed

## [1.6.1] - [2022-01-16]

### Bugfixes

-	Allow date input to be either a ISO 8601 date string or a Date object

## [1.6.0] - [2022-01-16]

### Changes

-	Removed `Revocation`.`reportId` as the ID is now the same for a report and it's revocation
-	Renamed `Revocation`.`revokedTime` to `revokedAt` as that is how it is stored in the database
-	Added `Report`.`reportCreatedAt`

## [1.5.4] - [2022-01-15]

### Bugfixes

-	Fix issue with `ReportMessageExtraOpts` having wrong `createdBy` type, changed to `APIUser`

## [1.5.3] - [2022-01-15]

### Bugfixes

-	Fix issue with `ReportMessageExtraOpts` having wrong `admin` property, renamed to `createdBy` as well

## [1.5.2] - [2022-01-15]

### Bugfixes

-	Fix issue with `RevocationMessageExtraOpts` not extending from `ReportMessageExtraOpts`

## [1.5.1] - [2022-01-13]

### Bugfixes

-	Fix issue with `Report` type not having required fields

## [1.5.0] - [2022-01-13]

### Changes
-	Change typings to `zod` structures and infer typings from that

## [1.4.2] - [2022-01-02]

### Bugfixes

-	Make `trustedCommunities` and `ruleFilters` on type `GuildConfig` required

## [1.4.1] - [2021-12-28]

### Changes

-	Change typing info on `guildConfigChangedMessage` to match the actual information that is sent

## [1.4.0] - [2021-12-22]

### Changes

-	Add WebSocket messages for merging rules and communities
-	Add WebSocket messages for updating rules and communities

## [1.3.0] - [2021-10-09]

### Changes

-   Community can have multiple guild IDs

## [1.2.1] - [2021-10-09]

### Changes

-   Removed contact and community name from CommunityConfig
-   Added roles to CommunityConfig

## [1.2.0] - [2021-09-19]

### Changes

-   Added User type definition
-   Added ESLint
-   Added Prettier

## [1.1.2] - [2021-09-11]

### Changes

-   Added `rule` to report message
-   Renamed `ReportRevokedMessage` to `RevocationMessage`

## [1.1.1] - [2021-09-11]

### Bugfixes

-   Renamed `user` to `contact` in community message opts

## [1.1.0] - [2021-09-11]

### Changes

-   Added WebSocket message typings
-   Added announcement message for futureproofing

## [1.0.3] - [2021-08-16]

### Changes

-   Modified changelog formatting to fit with other FAGC projects
-   Add `communintyId` to CommunityConfig as it is in the database

## [1.0.2] - [2021-08-08]

### Changes

-   Removed the `id` from `Profile` as it did not make any sense for it to have one

## [1.0.0] - [2021-07-14]

### Changes

-   Added all base API types
