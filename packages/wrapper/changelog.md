## [1.6.3] - [2021-06-22]
### Fixed
- WebSocket now uses `heineiuo/isomorphic-ws` so it can work in the browser and in node

## [1.6.1] - [2021-06-22]
### Fixed
- WebSocket will now emit events correctly and not delete their names before checking them

## [1.6.0] - [2021-06-20]
### Added
- WebSocket can now send the Guild ID to recieve the correct config
- WebSocket can be disabled with a configuration option

## [1.5.1] - [2021-06-19]
### Changed
- Offenses are now called profiles
- Violations are now called reports

## [1.5.0] - [2021-06-19]
### Added
- WebSocket handler for FAGC events [1d639eb2f665e524b9a0822cdac3553f83a5ecb4]

## [1.4.0] - [2021-06-19]
### Added
- Added back in the profile (offense) manager as stuff was hard without it [6f96ec45ca9e715a92b8b6e6f0813e449ce2c949]

## [1.2.0] - [2021-06-19]
### Added
- Added in the informatics manager to handle informatics endpoints (currently webhooks) [692341306917b21e59db9e6ae9ffbd039516a9c3]