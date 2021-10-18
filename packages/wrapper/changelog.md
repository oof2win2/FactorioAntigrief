## [1.15.0] - [2021-10-09]

### Changes

-   Notify guild with embed or text

## [1.14.0] - [2021-10-09]

### Changes

-   Support for multiple guilds per community

## [1.13.1] - [2021-09-21]

### Changes

-   Change in signup and login
-   Renamed `fetchOAuthURL` to `getsignupurl`

# [1.13.0] - [2021-09-19]

### Changes

-   Added User API wrapper

## [1.12.1] - [2021-09-11]

### Bugfixes

-   Updated WebSocket listeners to have correct events

# [1.12.0] - [2021-09-11]

### Changes

-   Added methods to fetch reports and revocations by modified time

# [1.11.0] - [2021-09-08]

### Changes

-   Added a method to fetch your own community with your API key

## [1.10.1] - [2021-09-07]

### Bugfixes

-   Fix `ReportManager#fetchAll` not returning expected results

# [1.10.0] - [2021-08-17]

### Changes

-   Added Master API rules part to create and remove rules
-   Prioritize request config over assigned props in requests
-   Filter revocations when fetching

## [1.9.1] - [2021-08-12]

### Bugfixes

-   Fixed that `Report.reportedTime` was not a date but said it was

# [1.9.0] - [2021-08-12]

### Changes

-   Added a `.destroy()` method on the wrapper and all managers to cancel all timeouts and exit cleanly

### Changes

-   Reworked wrapper to work with the new TS API

## [1.8.1] - [2021-07-15]

### Bugfixes

-   Removed an unnecessary `console.log`

# [1.8.0] - [2021-07-15]

### Changes

-   Changes the websocket to be disabled by default
-   Started using `fagc-api-types` for type declarations of the API
-   Reformatted changelog

## [1.7.3] - [2021-06-23]

### Changes

-   Remove `axios` and add in `isomorphic-fetch` as `axios` caused issues when it threw errors on 404s, which are used sometimes on some endpoints

# [1.7.0] - [2021-06-22]

### Changes

-   Removed `node-fetch` and instead installed `axios` as node-fetch was behaving funky with the browser

## [1.6.4] - [2021-06-22]

### Fixed

-   Fixed the implementation of the new ws client

## [1.6.3] - [2021-06-22]

### Fixed

-   WebSocket now uses `heineiuo/isomorphic-ws` so it can work in the browser and in node

## [1.6.1] - [2021-06-22]

### Fixed

-   WebSocket will now emit events correctly and not delete their names before checking them

# [1.6.0] - [2021-06-20]

### Added

-   WebSocket can now send the Guild ID to recieve the correct config
-   WebSocket can be disabled with a configuration option

## [1.5.1] - [2021-06-19]

### Changes

-   Offenses are now called profiles
-   Violations are now called reports

# [1.5.0] - [2021-06-19]

### Added

-   WebSocket handler for FAGC events [1d639eb2f665e524b9a0822cdac3553f83a5ecb4]

# [1.4.0] - [2021-06-19]

### Added

-   Added back in the profile (offense) manager as stuff was hard without it [6f96ec45ca9e715a92b8b6e6f0813e449ce2c949]

# [1.2.0] - [2021-06-19]

### Added

-   Added in the informatics manager to handle informatics endpoints (currently webhooks) [692341306917b21e59db9e6ae9ffbd039516a9c3]
