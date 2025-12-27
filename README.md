# jsonc-to-json

**Minimal transformer of JSONC to JSON, that strips comments and trailing commas**

- Version: 0.0.1
- Created: 27th December 2025 by Rich Plastow
- Updated: 27th December 2025 by Rich Plastow
- GitHub: <https://github.com/richplastow/jsonc-to-json>
- Live demo: <https://richplastow.com/jsonc-to-json/>

## What is it?

jsonc-to-json is a JavaScript library that transforms JSONC (JSON with Comments)
into standard JSON by stripping comments and trailing commas.

## Programmatic Usage

Your JSONC could come from anywhere, for example an example.jsonc file:


```jsonc
{
    // Comments and trailing commas are not allowed in JSON files.
    "key1": 1, // note the trailing comma after the value "TWO":
    "key2": "TWO",
}
```

```js
// jsonc-to-json usage example.
import { readFileSync, writeFileSync } from "node:fs";
import { jsoncToJson } from "jsonc-to-json";
const jsonc = readFileSync("example.jsonc", "utf8");
const regularJson = jsoncToJson(jsonc);
writeFileSync("example.json", regularJson);
```

Usage is similar to the popular
["strip-json-comments" package:](https://www.npmjs.com/package/strip-json-comments)

```js
// strip-json-comments usage example.
import { readFileSync, writeFileSync } from "node:fs";
import stripJsonComments from "strip-json-comments";
const jsonc = readFileSync("example.jsonc", "utf8");
const regularJson = stripJsonComments(jsonc, {
    trailingCommas: true, // strip trailing commas in addition to comments
});
writeFileSync("example.json", regularJson);
```

Both examples above will produce the following JSON output:

```json
{
    "key1": 1,
    "key2": "TWO"
}
```

## Command line usage

You can also run jsonc-to-json from the command line:

```bash
# Pass a JSONC string in to the dist/ script directly, and echo the output.
node dist/jsonc-to-json.js '{/* comment */"key1":1,}'
# {"key1":1}

# Or pipe JSONC from stdin.
cat example.jsonc | npx jsonc-to-json > example.json

# Or read from a file directly.
npx jsonc-to-json < example.jsonc > example.json

# Or, after making the dist/ file executable, chain commands together.
chmod +x dist/jsonc-to-json.js
echo '{/* comment */"key2":"TWO",}' | ./dist/jsonc-to-json.js | jq '.key2'
# "TWO"
```

## Contributing

### Develop

```bash
npm install --global static-server
# added 1 package ...
static-server --version
# static-server 2.2.1
static-server --no-cache .
# ...
# * Serving files at: http://localhost:9080
# * Press Ctrl+C to shutdown.
```

Visit <http://localhost:9080/docs/> - there's no hot-reloading, so refresh the
browser manually to see changes.

> [!TIP]
> `static-server`'s `--no-cache` makes sure you're always loading up-to-date
> source files during development.

### Install and build

```bash
npm install --global rollup
# added 4 packages ...
rollup --version
# rollup v4.54.0
npm install
# Installs the "@types/node" dev-dependency
# ~3 MB  for ~140 items
npm run build
# > jsonc-to-json@0.0.1 build
# ...
# src/jsonc-to-json.js → dist/jsonc-to-json.js...
# created dist/jsonc-to-json.js in 12ms
# 
# src/jsonc-to-json.js → docs/jsonc-to-json.js...
# created docs/jsonc-to-json.js in 3ms
# ✅ Build succeeded!
```

### Check types

```bash
npm install --global typescript
# added 1 package in 709ms
tsc --version
# Version 5.9.3
npm run check-types
# ...
# ✅ No type-errors found!
```

### Unit tests and end-to-end tests

```bash
npm test
# ...
# ✅ All tests passed!
```

### Preflight, before each commit

```bash
npm run ok
# ...runs tests, checks types, and rebuilds the bundle-file in docs/
# ...
# ✅ Build succeeded!
```

### Preview

```bash
static-server --no-cache docs
# ...
# * Serving files at: http://localhost:9080
# * Press Ctrl+C to shutdown.
```

Visit <http://localhost:9080/> (without 'docs/') to check the live demos work.
