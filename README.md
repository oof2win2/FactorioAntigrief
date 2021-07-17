fagc-backend
---

## Contents
- [Introduction](#introduction)
	- [Installation](#installation)
	- [TODO:](#todo)

# Introduction

The backend for the Factorio Anti-Grief community

[![View API in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/13894069-316d1e66-91a8-4707-bb7f-55fbd956fb89?action=collection%2Ffork&collection-url=entityId%3D13894069-316d1e66-91a8-4707-bb7f-55fbd956fb89%26entityType%3Dcollection%26workspaceId%3D0612efff-f7ea-4c15-89e8-63ef13852eeb)

This README is focused solely on the installation instructions and the workings of the API. If you would like an explanation for this API, please [see this](https://github.com/oof2win2/fagc-discord-bot#readme).

## Installation

[⬆️ Head back up](#contents)

1. Install MongoDB as the database. You can use one of two methods:
   1. Use MongoDB Atlas. This is a completely free service offered by MongoDB. It is however limited to 350MB of storage (you won't realistically reach that quickly) and can be hosted further away than you can host it yourself, which results in higher latency. [Set an instance up here, they offer a free and paid tier](https://www.mongodb.com/basics/mongodb-atlas-tutorial)
   2. Set up your own MongoDB instance locally. This is more tedious as you install the database on your own system. It however has the advantage of generally being lower-latency with regards to the bot and API, as there is a much smaller physical distance separating the two (and also less electronics). [Install according to this guide for free](https://docs.mongodb.com/manual/installation/)
2. Set up your `config.js` file according to the [`config.example.js`](config.example.js) file.
3. Run the program with one of:
   1. `nodemon`
   2. `pm2 start pm2.config.js`
   3. `node .`


## TODO:
- [ ] Maybe migrate the bot's config database to the API and make the bot not use the config database entirely?
- [ ] Use `fastify-helmet`
- [ ] Firgure out how to use `yup` with response validation

