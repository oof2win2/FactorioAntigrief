# fagc-clientside-bot

## Installation

Pre-requisites:
- Make sure that you have node installed (v16+).

1. `git clone https://github.com/oof2win2/fagc-clientside-bot && cd fagc-clientside-bot`
2. `npm i`
3. Set configs, importantly the `.env`, `config.ts` and `servers.ts` according to the examples
4. `npx prisma generate` - generate the database stuff for prisma
5. `npx prisma db push` - push tables to the database
