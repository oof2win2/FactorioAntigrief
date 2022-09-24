# Implementation of the Clientside Bot

The Clientside bot is an integral part of using FAGC automatically, as it allows for reports to be turned into bans if they match your filters.
On this page, we will go through how the bot works, and how you can use it.

## Bot Basics

Before we start talking about how the bot works, we need to talk about some basics of the bot.
First off, there are a couple of data types that are referenced everywhere. They are PrivateBan, Whitelist, and FAGCBan.
They are all integral for the functioning of the bot, so let's go through them.

### FAGCBan

This is the most basic data structure that the bot uses very often. Since the bot must be able to run without a connection to the FAGC API at all times
(for example, if the API is down), the bot must store all the data it needs to make decisions locally. This is where the FAGCBan structure comes in.
It is a structure that contains the most basic information about a FAGC report, consisting of it's ID, player who was banned, category ID, when the report
was created, and when it was revoked (we will get into why we store the revocation date later).

### PrivateBan

The next data structure is the PrivateBan structure. This structure is used to store information about a ban that is not public, meaning that is is not
shared across communities - hence the name "Private". This structure contains the player who was banned, the player who banned them (if any), the reason,
the date the PrivateBan was created, and the date it was revoked. Simply put, if you want to ban someone only on your servers for any arbitrary reason,
such as if you just don't like the person, you can use this structure to do so without having to worry about it being shared across communities.

PrivateBans can be created, checked for, and removed with the `/privateban` command in Discord.

### Whitelist

This is one of the most important data structures in the bot. Whitelists implemented by this bot are not the same as using the `/whitelist` command
in-game - that would simply not work. The thing is, when you use `/whitelist` in-game, **only** the players on the whitelist are able to join. This is
not desired, as you wouldn't even need the FAGC bot for handling this.

Instead, the bot uses these whitelist entries to determine if a player should be immune to FAGC bans completely.
Say you have your own server (A) which has some traffic and you ban someone who was griefing a lot. If the person you
banned managed to gain access to the Discord account of an admin on community B. If you trust community B and have them in your filters, the griefer
could easily create a report against you and then suddenly, you would be banned on your own server. This is not at all desired. To prevent this from
happening, you can whitelist yourself (and any other players you trust) to ensure that they will be immune to any FAGC reports created against them.

Now, if a report is created against a player who is whitelisted, the report will be stored, but nothing will happen with it. This is because the bot
knows that you whitelisted the player, so they are immune to FAGC bans.

Whitelists can be created, checked for, and removed with the `/whitelist` command in Discord.


## Some important things to know

So, you have your bot running on your server! Great! But, there are a couple of things you might want to know about it, so that you can use it to it's
full potential.

### Changing your filters

Every community and guild has their own filter object. This filter is what determines what reports are banned for, and what reports are just stored.
Say you want to change your filters, as you probably will do sometime in the future. You don't want to have to clear your bot's database and repopulate it
every time you do this, as that would be a mess to upkeep. Instead, this is handled automatically. As the clientside bot keeps a WebSocket connection to
the FAGC API, it will receive updates to your filter as you change it. Since every FAGC report is stored in the local database, the bot can check if
the new filter would ban any of the reports that are stored but not banned for. If there are any like that, the bot automatically bans for those reports!

The same works for removing filters. If you remove a category or community filter, the bot will automatically unban any players that were banned for
reports that matched those filters (assuming they don't have any other reports which match the current filters).


### The bot reconnecting to the API

The internet does not always have to be stable. There can be outages, maintanances, or your server could even crash. If the bot would just stop working
and not receive information about reports that are created or revoked in the meantime, you would lose out on a lot of information, and some players would
not be banned or unbanned properly.

To prevent this, every time the the bot receives a piece of data through the WebSocket connection, it will store the date of when the data was received.
If the bot then needs to reconnect, it will just take that timestamp and ask the API for all reports that were created or revoked after that timestamp.
This means that the bot will never miss a report, and will always be up to date with the FAGC API. Pretty neat, huh?

### A server restarting

Your servers might not always be on. That however doesn't mean, that they shouldn't receive bans or unbans that occured while they were offline. To ensure
that this is the case, the bot stores the time a server went offline in the database. When the server comes back online, the bot will collect all of the
data that it has in it's database and group it by playername. Assume that the time the server went offline is T1 and the current time is T2. For each player, it will then perform the following actions:

1. Does the player have a valid whitelist entry at T2? If so, unban them. If not, continue.
2. Does the player have a valid PrivateBan entry at T2? If so, ban them. If not, continue.
3. Does the player have any FAGCBans that were created after T1? If so, ban the player. If not, continue.
4. Does the player have any FAGCBans that were revoked after T1? If so, unban the player. If not, continue.

This is a simplification of the more complex code that the bot uses to check for which players should be banned or unbanned, but it should give you a good
idea of how a server restart won't cause any harm.

This is also why the bot stores dates of revocation for FAGCBans, Whitelists and PrivateBans. If any is revoked and any server is offline, the bot will
still be able to perform the above actions correctly.

!> As of 2022/09/24, the bot does not check for servers being online very often. If a server is offline for over 24 hours, the bot will be checking for the
server being online every 24 hours. For updates on this issue, please see [#154](https://github.com/FactorioAntigrief/FactorioAntigrief/issues/154)