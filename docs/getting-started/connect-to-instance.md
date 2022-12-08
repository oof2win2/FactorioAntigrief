# Connection to an instance

This page describes how to connect to an existing FDGL instance in order to benefit from banlist synchronization.

You can however also "connect" to FDGL by only generating a banlist once in a while, which is an
effective method if you are unable to host the bot yourself or it is too complicated for you to do.
For that, please view [Generating a banlist only](#Generating-a-banlist-only)

## Connecting to view bans

1. Invite the bot to your Discord server through [our invite link](https://discord.com/api/oauth2/authorize?client_id=817908486494617621&scope=bot+identify+applications.commands+applications.commands.permissions.update&response_type=code&redirect_uri=https%3A%2F%2Ffactoriobans.club%2Fapi%2Fdiscord%2Foauth%2Fcallback&permissions=156766628928).
   The bot will ask for some permissions that are necessary for it to function properly, so please don't disable any of them
2. Once you have the bot in your server, you can use the `/config set permissions` command to set permissions for commands.
   Only the server owner can do this initially. See the image below for how this looks
3. Once you have set the permissions, you can set your community and category filters. This is when FDGL comes into play,
   as these filters are what ensures that players are banned only from communities you trust and categories you yourself acknowledge.
4. If you have an API key that can be used to create reports (you would have been told about this explicitly by a FDGL maintainer), you can set the API
   key on the bot with `/config set APIKEY`. This will allow you to use `/reports create` to create reports

## Connecting to the API

If you don't want to use the pre-existing toolset that we offer, you may want to connect to the API with our [API wrapper](../../packages/wrapper/README.md),
or with any other toolset that can send HTTP requests. To set up the wrapper, it is fairly easy: simply provide the API key that you have been given, or none if you want to use the public part of the API. See the code example below for how to do this:

```js
import { FDGLWrapper } from "@fdgl/api-wrapper"

const fdgl = new FDGLWrapper({
	apikey: "here is your API key",
})

// creating a report
fdgl.reports.create({
	report: {
		playername: "oof2win2",
		categoryId: "QemkYJ",
		proof: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		description: "not obeying admins, which is not good",
		adminId: "429696038266208258",
	},
})
```

You can alternatively also use the API itself, for which we have Swagger documentation available [here](https://factoriobans.club/api/documentation).

!> In API requests, the API key must have a `Bearer ` prefix. This is managed by the API wrapper itself, but you must add this in with your
request, even in the Swagger tester.

## Importing your existing bans

For this, you will need an API key that can create reports. You would have been told about having this by a FDGL core member. Now, we will go through
importing your existing bans into FDGL, so that you can have them synchronized with other people and have other communities benefit as well.

First off, you will need to categorize all of your bans. This is the hardest part, as you will need to go through each ban individually and select
the different categories that the player violated. Ideally you will also provide proof so that in the future, the report can be disputed and if deemed
no longer valid, it may be revoked.

We offer a template for a Google Sheet which you can use (available [here](https://docs.google.com/spreadsheets/d/1k9TRGhaj2YutVAvBEGoR4RMWOh84VTOMMtx7Qk1EPKU/edit?usp=sharing)).
There is an "example" page where you can seee the reports that were imported into AwF, and then there is a "blank" page, where you can place your bans.

This is the short process that you may want to follow for each ban that you have:

1. Type in the playername into the "PLAYERNAME" column
2. Type in the description (what the player did etc.) into the "DESCRIPTION" column
3. Check the box in the "RB" column if the report fits into the "Removing Buildings" category - this is a shortcut, as there usually is a lot of these
   and it is faster to click a single checkbox than select it from a list
4. Select any other categories that the player violated in the "CATEGORY" columns. There are only four, but you can add more columns as you require
5. Type in the ISO-8601 timestamp into the "DATE" column. An available date picker is [here](https://www.timestamp-converter.com/)
6. Type the name or any identification of the admin who created the report into the "BY" column. Make note of this,
   as it is used to identify the admin when you import the report into FDGL
7. Place any proof into any one of the "PROOF" columns. Fill from the left to right, so that the first proof is the first column,
   the second proof is the second column etc.
8. Click the checkbox in the "DONE" column to signify that this ban can be imported later. Without this checked, the script will ignore it

After you have all of your reports categorized, you need to download the sheet as a .csv file and save it. Then download the [script](data/connect-to-instance_import-bans.js).
You will need to install the dependencies (`FDGL-api-wrapper` and `csv`), and then fill in your API key and guild ID.
FDGL uses **discord IDs** for identification of users, so between line 14 and 22 (the object called `mods`), please fill in the IDs of the admins
who created reports, indexed by the names you used in step 6 of the categorization process.
After you have this done, simply run `node connect-to-instance_import-bans.js` and the reports will start to be imported into FDGL slowly.
To estimate the amount of time required to run the script, get the amount of categories per record in the csv (including RB, this is about 3 on average),
multiply by the amount of records you have (rows in the sheet or lines in the file) and divide by 50. This will give roughtl you the amount of
minutes that the import will take, but this may vary depending on the amount of categories per each record.

!> Do not try changing the intervals or use the FDGL API in any other way during importing, or you will be hit with a rate limit

## Using the clientside bot

The clientside bot is an integral part of the FDGL ecosystem if you want to automate banning and unbanning players on your server with a minimal setup
and minimal effort. In this part, we will go through the setup of the bot, and how to use it to automate banning and unbanning players.

1. Clone the FDGL repository and install it on your server, just as if you would [install it selfhosted](./getting-started/installation-selfhosted.md).
   Below is a command that will do this for you.

```
git clone https://github.com/FactorioAntigrief/FactorioAntigrief/ && \
cd FactorioAntigrief && \
yarn install && \
yarn build
```

2. Set up a Discord bot at the [discord developers site](https://discord.com/developers)
3. Fill in the `.env` and `servers.json` files in the `apps/clientside-bot` directory with your information, according to the example files.
4. Run the `yarn db:sync` command to create the tables in the database.
5. Invite your bot to your guild with the `140123621440` permission integer and `bot+applications.commands` scopes.
6. Run the `yarn bot:addcommands` command to populate commands in your guild.
7. Run the bot with node, nodemon, pm2, or similar tools to keep it running.


## Generating a banlist only

This part of the guide serves to help if you want to only get your banlist once in a while, taking a
"snapshot" of the current state of FDGL. This is very useful if you are unable to use the clientside bot.

This method is also highly reccomended when you don't have a dedicated server that runs 24/7, as it
would not be useful to have the bot run all the time if the Factorio server would not be online.


Prerequisites:
-	Have the FDGL bot in your guild, see the instructions [here](#Connecting-to-view-bans) for how to do so

1. Create a list of categories your community will respect (ban for) by getting them with
`/categories list`. You can then view the names of all categories that are in the system with
their respective IDs. You can also use the `/categories details` command to view the description
of a specific category if you would like more thorough information. You will however need a list of category IDs separated with spaces, such as `7LxjUX Oefczd u6HCU2 d9lY7t 5YdwHW`
2. Use the `/categories add` command to add the categories to your filters. You can input multiple
categories at once, such as `/categories add 7LxjUX Oefczd u6HCU2 d9lY7t 5YdwHW`. Remember to
confirm the action.
3. Create a list of communities that your community will acknowledge (accept reports from) by
getting them with `/communities list`. Create a list of the communities that you wish to
acknowledge, separated with spaces, such as `5nXzxm DbJ0mH 9KAbEA`
4. Use the `/communities add` command to add the communities to your filters. You can input multiple
communities at once, such as `/communities add 5nXzxm DbJ0mH 9KAbEA`
5. Use `/generate banlist` to get the bot to generate a banlist for you. This will send a JSON file
to the channel that the command was executed in, which contains all the bans that match the criteria
you input with the filters. You can use this JSON file with Factorio and have Factorio use it as
your banlist.
