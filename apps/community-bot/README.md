## FDGL Discord Bot

## Contents

- [FDGL Discord Bot](#fdgl-discord-bot)
- [Contents](#contents)
- [Explanation](#explanation)
  - [Key terms](#key-terms)
  - [Data Types](#data-types)
- [Installation](#installation)

## Explanation

[⬆️ Head back up](#contents)

FDGL (Factorio Anti-Grief Community) is a community of people who try to work against griefers in Factorio.

### Key terms

[⬆️ Head back up](#contents)

- Community: A community is a group of people that play Factorio together and use this API in a way to prevent griefing on their servers
- Report: A single instance of unwanted behaviour of a player that has been reported. Can be revoked which turns the report into a revocation
- Category: A grouping of unwanted behavour a report falls into. Reports are categorized by which aspect of gameplay/user interaction falls under.
- Revocation: A single instance of a report that has been revoked, i.e. it was found out that the report was false. Revocations can never be turned back to reports

### Data Types

[⬆️ Head back up](#contents)

This is a short description of the different data that you may encounter with this bot or its ecosystem, it is however not a complete developer guide.
All `id` properties are generated automatically by the API and cannot be set by users.

- **Community**
  - `id` - ID of the community. Only used to fetch said community
  - `name` - Name of the community. Does not need to be the same as the name of the community's guild server
  - `contact` - Discord UserID of the contact user for the community
  - `guildId` - Discord GuildID of the Discord guild for the community
- **Report**
  - `id` - ID of the report. Used to fetch and revoke reports created by your community
  - `playername` - Name of the player that is being reported
  - `adminId` - Discord UserID of the administrator that created this report
  - `proof` - Proof of the report
  - `description` - Description of the report
  - `automated` - Whether the report was automatically generated in response to a player action
  - `categoryId` - The ID of the category the report falls under
  - `communityId` - The ID of the community that has created this report. Is set automatically by the API
  - `violatedAt` - The time at which the report was created
- **Profile**
  - `communityId` - The ID of the community that has created these reports. Is set automatically by the API
  - `playername` - The name of the player that these reports belong to
  - `reports[]` - The collection of reports that have been created
- **Revocation**
  - `id` - ID of the revocation. Only used to fetch said revocation
  - `playername` - Name of the player who's report has been revoked
  - `adminId` - Discord UserID of the administrator that created this report
  - `proof` - Proof of the report
  - `description` - Description of the report
  - `automated` - Whether the report was automatically generated in response to a player action
  - `categoryId` - The ID of the category the report falls under
  - `communityId` - The ID of the community that has created this report. Is set automatically by the API
  - `violatedAt` - The time at which the report was created
  - `revokedAt` - The time at which the report has been revoked
  - `revokedBy` - The Discord UserID of who revoked the report
- **Category**
  - `id` - The ID of the category. Used to tell the API which category a report is filed under. Can also be used to fetch said category
  - `name` - Name of the category
  - `description` - A short definition of the category

## Installation

[⬆️ Head back up](#contents)

Installation instructions are useful only in the case when you want to **self-host the whole ecosystem**

1. Set up the API [See installation instructions here](https://github.com/oof2win2/fdgl-backend#readme)
2. Install dependencies with `npm i`
3. Set up your `config.js` file according to [`config.example.js`](config.example.js). Make sure that the database connection string is the same as for the API but with its collection set to `bot` instead of `fdgl`
4. Run the program with one of:
   1. `nodemon`
   2. `pm2 start pm2.config.js`
   3. `node .`
5. [Add the bot to your guild](https://discordjs.guide/preparations/adding-your-bot-to-servers.html)
