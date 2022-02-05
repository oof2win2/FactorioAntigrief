## UNRELEASED

### Changes

-   Renamed report rules to categories

### Additions

-   Added in Master Rules API to add and remove rules with a master API key
-   `authentication` documents now have a property of being either `public` or `master`, depending on which API they serve. `master` will work for `public` routes too.

## [2.0.0] - [2021/08/12]

### Changes

-   Removed src/bin/www as app.js was fine to use without it
-   Migrated whole project to Typescript
-   Added .env support instead of a .ts file
