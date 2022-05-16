# Connection to an instance

This page describes how to connect to an existing FAGC instance in order to benefit from banlist synchronization.

## Connecting to view bans

1. Invite the bot to your Discord server through [our invite link](https://factoriobans.club/api/discord/oauth/url). The bot will ask for some
   permissions that are necessary for it to function properly, so please do not disable some of them
2. Once you have the bot in your server, you can use the `fagc!setperms` command to set permissions for commands.
   Only the server owner can do this initially. See the image below for how this looks
3. Once you have set the permissions, you can set your community and category filters. This is when FAGC comes into play,
   as these filters are what ensures that players are banned only from communities you trust and categories you yourself acknowledge.
4. If you have an API key that can be used to create reports (you would have been told about this explicitly by a FAGC core member), you can set the API
   key on the bot with `fagc!setapikey`. This will allow you to use `fagc!create` and `fagc!createadvanced` to create reports

## Connecting to the API

If you don't want to use the pre-existing toolset that we offer, you may want to connect to the API with our [API wrapper](../../packages/wrapper/README.md),
or with any other toolset that can send HTTP requests. To set up the wrapper, it is fairly easy: simply provide the API key that you have been given, or none if you want to use the public part of the API. See the code example below for how to do this:

```js
import { FAGCWrapper } from "fagc-api-wrapper"

const fagc = new FAGCWrapper({
	apikey: "here is your API key",
})

// creating a report
fagc.reports.create({
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

For this, you will need an API key that can create reports. You would have been told about having this by a FAGC core member. Now, we will go through
importing your existing bans into FAGC, so that you can have them synchronized with other people and have other communities benefit as well.

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
6. Type the name or any identification of the admin who created the report into the "BY" column. Make not of this,
   as it is used to identify the admin when you import the report into FAGC
7. Place any proof into any one of the "PROOF" columns. Fill from the left to right, so that the first proof is the first column,
   the second proof is the second column etc.
8. Click the checkbox in the "DONE" column to signify that this ban can be imported later. Without this checked, the script will ignore it

After you have all of your reports categorized, you need to download the sheet as a .csv file and save it. Then download the [script](../data/connect-to-instance_import-bans.js).
You will need to install the dependencies (`fagc-api-wrapper` and `csv`), and then fill in your API key and guild ID.
FAGC uses **discord IDs** for identification of users, so between line 14 and 22 (the object called `mods`), please fill in the IDs of the admins
who created reports, indexed by the names you used in step 6 of the categorization process.
After you have this done, simply run `node connect-to-instance_import-bans.js` and the reports will start to be imported into FAGC slowly.
To estimate the amount of time required to run the script, get the amount of categories per record in the csv (including RB, this is about 3 on average),
multiply by the amount of records you have (rows in the sheet or lines in the file) and divide by 50. This will give roughtl you the amount of
minutes that the import will take, but this may vary depending on the amount of categories per each record.

!> Do not try changing the intervals or use the FAGC API in any other way during importing, or you will be hit with a rate limit
