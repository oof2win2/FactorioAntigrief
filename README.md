# FAGC

This repository is a monorepo that houses the entire FAGC project.
FAGC is a free and open-source software project that aims to provide a centralized banlist for Factorio server owners and players.

If you would like to view the documentation, you can see markdown [here](./docs/README.md) or the HTML version [here](https://factorioantigrief.github.io/FactorioAntigrief/).
This is most likely the page you are looking for if you are not attempting to set up your own instance of FAGC but instead use the public one hosted
by the FAGC team.

## Installation

This is to install the whole ecosystem from GitHub, which is often **not** what you want to do. Please check out
[how to connect to the public instance](https://factorioantigrief.github.io/FactorioAntigrief/#/./getting-started/connect-to-instance) first, as that may be what you need.

Prerequisites:

-   `yarn` installed globally (`npm i -g yarn`)
-   `turbo` repo installed globally (`npm i -g turbo`)

1. Clone the repo by running `git clone https://github.com/FactorioAntigrief/FactorioAntigrief && cd FactorioAntigrief`
2. Install dependencies with `yarn install`
3. Run tests and build with `turbo run test build`. This will make sure that every project has TypeScript built and is tested, so you know that it worked when you cloned it
4. Enjoy! It is recommended to run the apps with `pm2`, which has it's documentation [here](https://pm2.io)

## Workflow

For everything, `turbo` and `yarn` are used. To build a specific app/package, go into the directory of said app/package and run `yarn build`. To build, lint, and test all apps, run `turbo run lint build test`. If you instead run `turbo run lint && turbo run test && turbo run build`, `turbo` will be unable to schedule it's work smartly and take less time, which it does when running the recommended way.

## Contributing

To contribute to the project, please see [Installation](#installation) to install the project first. Please also see the [contribution guidelines](CONTRIBUTING.md).

If you want to see what needs to be done, please see the [currently opened issues](https://github.com/FactorioAntigrief/FactorioAntigrief/issues) for what needs to be done.
