# Contributing

## Workflow

For everything, `turbo` and `yarn` are used. To build a specific app/package, go into the directory
of said app/package and run `yarn build`. To build, lint, and test all apps, run `turbo run lint build test`.
If you instead run `turbo run lint && turbo run test && turbo run build`, `turbo` will be unable to
schedule it's work smartly and take less time, which it does when running the reccomended way.

## Contrubuting

To contribute to the project, please see [Installation](#installation) to install the project first. Please also see the [contribution guidelines](CONTRIBUTING).

If you want to see what needs to be done, please see the [currently opened issues](https://github.com/FactorioAntigrief/FactorioAntigrief/issues) for what needs to be done.

## Documentation

Documentation is very important, as otherwise people will get lost in the code that you write - which
is not desired. We therefore strive to have as much documentation as possible (within reason) so that
anyone else looking at the code can understand it. For this, please:
-	Ensure that you use comments inside code itself
-	Use JSDoc comments when you are writing functions that will be commonly used or are exposed, as
this allows people to see what the function does, what parameters it accepts, etc.
-	Create documentation in the docs/ folder, which is written in Markdown syntax and is built with
Docsify. To build it, please run `yarn run docs` in the root of the FAGC repository.