## Installation of the ecosystem

This is to install the whole ecosystem from GitHub, which is often **not** what you want to do. Please check out
[how to connect to the public instance](#-Usage-for-the-end-user) first, as that may be what you need.

Prerequisites:

-   `yarn` installed globally (`npm i -g yarn`)
-   `turbo` repo installed globally (`npm i -g turbo`)

1. Clone the repo by running `git clone https://github.com/FactorioAntigrief/FactorioAntigrief && cd FactorioAntigrief`
2. Install dependencies with `yarn install`
3. Run tests and build with `turbo run test build`. This will make sure that every project has TypeScript built and is tested, so you know that it worked when you cloned it
4. Enjoy! It is reccomended to run the apps with `pm2`, which has it's documentation [here](https://pm2.io)
