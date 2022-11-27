# FAGC

This repository is a monorepo that houses the entire FAGC project.

FAGC is a free and open-source software project that aims to provide a centralized banlist for Factorio server owners and players, with the aim
of synchronizing the banlist across servers with some specific filters. If you don't know much about the project and would like to know more,
please check out [About FAGC](#about-fagc)

To find out how to connect to the public FAGC instance, please go to [Connection to an instance](./getting-started/connect-to-instance.md)

## Basic Structures

There are a few basic data structures that are important for understanding how the project works:
- **Category**
	- Represents something into which a "ban" can be categorized. Examples of categories are "cheating", "spamming", "griefing", etc.
	- Common for every community, and can be only changed by the maintainers of the project
- **Community**
	- Represents a community of players that share a common banlist. Examples of communities are "ExplosiveGaming", "Comfy", "AwF", etc.
	- A community is created only by the maintainers of the project on request, and allows said community write access to the API
- **Report**
	- Single instance of a player being reported to FAGC for breaking a rule, as defined by a category
	- Belongs into a single community
	- Can be created only by people who have FAGC API write access, for which you need to contact the maintainers of the project (for now)
	- It is possible to *revoke* a report **only by the community which created it**, for everyone else it is read-only
- **Revocation**
	- Single instance of a report being revoked by the community which created it
	- **Cannot be removed from the database, it is a permanent record**
	- Is read-only for the community which created the report, meaning
	- If you do not belong to the community which created the report, you can only see the revocation if you know it's ID. This is to prevent
	  prejudice against people who have had their reports revoked, as reports can be accidental
- **Filter Object**
	- Represents what communities you "trust" and the categories you "acknowledge" as valid
	- See [Basic Usage](#basic-usage) for a more detailed explanation

## Basic Usage

We should initially start by explaining the difference between a "ban" and a "report", as these two terms may sound similar, but actually have very different
meaning in FAGC. A "report" is a single instance of a player being reported to FAGC for breaking a rule, as defined by a category. This means that the central
system knows about this player breaking this rule, but it doesn't do anything with this information - it can only provide it to anyone who asks for it.

A "ban" is when you turn this report into an actual ban - as you would do with for example `/ban Windsinger`. This actually prevents the player from accessing
your server and your server only. This is scoped to any community, with API access or not. The main premise of FAGC is that you *can* use a report to ban a
player - but you of course don't need to. You can choose to ignore a report based on some criteria, and that's perfectly fine. Everyone has different rules, and
we try to accomodate for that. We don't want to force you to ban someone just because someone else did.

Now, let's talk about filters. If you invite the FAGC Community Bot to your server, it will automatically create a filter object for you. This filter object
represents what communities you "trust" and the categories you "acknowledge" as valid. "Trusting" a community refers to whether you want to ban for reports
created by this community, such as if you want to ban for reports created by the ExplosiveGaming community. "Acknowledging" a category refers to whether you
want to ban for reports created for this category, such as if you want to ban for reports created for the "Spamming Chat" category.

You can change these settings at any time - you can trust a community, untrust a community, acknowledge a category, unacknowledge a category. This means that
the FAGC system itself is low-trust - by default, you don't trust anyone (except yourself) and you don't acknowledge any categories. You must **explicitly** trust a community
or acknowledge a category for their reports to be considered valid. This means that by default, you won't ban anyone for any category. Once you add communities
you trust to your filters, you will start banning for reports created by those communities. Once you add categories you acknowledge to your filters, you will
start banning for reports created for those categories. For a report to be considered "valid" for your community, it must be created by a community you trust
and for a category you acknowledge, otherwise it **will not be banned for**.

An example of how this works is as follows:
- You trust community A and C, but not B
- You acknowledge category X, Y, but not Z
- You get a report for category X, created by community A. You ban this player for this, as the report matches your filters
- You get a report for category Y, created by community B. You do not ban this player for this. Even though the report is created for a category you acknowledge,
  it is not created by a community you trust, so it is not considered valid
- You get a report for category Z, created by community C. You do not ban this player for this. Even though the report is created by a community you trust, it
  is not created for a category you acknowledge

You can invite the FAGC Community Bot to Discord and create "snapshots" of players who are to be banned by your filters, as the bot allows you to export a
banlist that is generated upon request. With this, you can have a simple file which you only need to update once in a while, with no need to do anything else
besides hosting your Factorio server. This is the simplest way of using FAGC, and is recommended for most people. You can read more up on it
[here](./getting-started/connect-to-instance.md#generating-a-banlist-only).

FAGC however also provides a more advanced way of being implemented into your Factorio server. This is done by using the FAGC Clientside Bot, which is a Discord
bot that **you host yourself**. It connects to the FAGC API and when a new report is created, it can automatically ban the player for you. Same for revocations,
it can automatically unban the player for you. This is a more advanced way of using FAGC, and is recommended for people who want their banlist to be updated
automatically. You can read a more detailed guide [here](./getting-started/connect-to-instance.md#using-the-clientside-bot).

For the people willing to code their own implementation, we also provide an API for you to connect to. You can view the TypeScript wrapper
[here](./getting-started/connect-to-instance.md#connecting-to-the-api) or view the [Swagger documentation directly](https://factoriobans.club/api/documentation/static/index.html).

With both methods of usage, you will most likely want to use the FAGC Community Bot to manage your filters. You can invite it [here](https://discord.com/api/oauth2/authorize?client_id=817908486494617621&scope=bot+identify+applications.commands+applications.commands.permissions.update&response_type=code&redirect_uri=https%3A%2F%2Ffactoriobans.club%2Fapi%2Fdiscord%2Foauth%2Fcallback&permissions=156766628928).
