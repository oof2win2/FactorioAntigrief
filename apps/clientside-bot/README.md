# fagc-clientside-bot

## Installation

Pre-requisites:
- Make sure that you have node installed (v16+).

1. `git clone https://github.com/FactorioAntigrief/FactorioAntigrief.git && cd apps/clientside-bot`
2. `npm i`
3. Set configs, importantly the `.env` and `servers.json` according to the examples
4. `npm run db:sync` - sync database stuff from typeorm
5. `npm run bot:addcommands` - update discord application commands

TODO:
- [X] check for bans with new players when the bot connects
- [X] clear banlists every week - use `/banlist clear` on servers
- [X] remove allowal for one shared banlist, it causes issues when it gets added to due to overwriting
- [ ] sync command permissions with community bot