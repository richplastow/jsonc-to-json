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

It switches to a Rust and WebAssembly (WASM) backend for large inputs (1000+
chars) to improve performance, while keeping a pure JavaScript implementation
for smaller inputs and environments where WASM is not available.

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
const regularJson = jsoncToJson(jsonc); // default to "auto" wasmMode
writeFileSync("example.json", regularJson);
```

Produces the following JSON output:

```json
{
    "key1": 1,
    "key2": "TWO"
}
```


`jsoncToJson()` accepts an optional `{ useWasm }` option with three modes:

- `"auto"` (default): run the Rust WASM backend once the input reaches 1000+
  chars, otherwise fall back to JavaScript for minimal startup cost.
- `"always"`: force the Rust path for every call; throws if the WASM bundle is
  missing or failed to initialise.
- `"never"`: stick to the JavaScript implementation, which is handy for
  debugging or when bundling for extremely small environments.

The JS and Rust pipelines share the same character-by-character logic, so you
should see identical output regardless of the mode you choose.

> [!NOTE]
> jsonc-to-json is used in a similar way to the popular
> ["strip-json-comments" package:](https://www.npmjs.com/package/strip-json-comments)
> 
> ```js
> // strip-json-comments usage example.
> import { readFileSync, writeFileSync } from "node:fs";
> import stripJsonComments from "strip-json-comments";
> const jsonc = readFileSync("example.jsonc", "utf8");
> const regularJson = stripJsonComments(jsonc, {
>     trailingCommas: true, // strip trailing commas in addition to comments
> });
> writeFileSync("example.json", regularJson);
> ```

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

## JavaScript setup, install, build, test and develop

### Switch to the correct Node.js version

Assuming you have nvm (Node Version Manager) installed:

```bash
# Check your current Node.js version.
node --version
# v12.3.4

# Switch to the version specified in the .nvmrc file.
nvm use
# Found ' ... jsonc-to-json/.nvmrc' with version <v24.8>
# ...
# You need to run `nvm install` to install and use the node version specified in `.nvmrc`.

nvm install
# Found ' ... jsonc-to-json/.nvmrc' with version <v24.8>
# ...
# Now using node v24.8.0 (npm v11.6.0)
```

You only need to run `nvm install` once to install the specified Node.js version.
After that, you can switch to it anytime in this repo, by running `nvm use`.

### Install dependencies and build

You'll need to set up Rust and wasm-pack to complete the build process -
[see below.](#set-up-the-rust-and-wasm-toolchain-and-install-wasm-pack)

```bash
# Install the "@types/node" dev-dependency - ~3 MB for ~140 items.
npm install
# ...

# Install rollup (globally, but within nvm's Node 24.8) to run the build.
npm install --global rollup
# added 25 packages in 3s

# Check rollup is installed.
rollup --version
# rollup v4.54.0

# Run the full build process - it starts with WASM, before running the JS build.
npm run build
# > jsonc-to-json@0.0.1 prebuild
# > cd wasm/jsonc_to_json && wasm-pack build --target web --out-dir pkg && cd ../.. && node scripts/embed-wasm.js
# [INFO]: 🎯  Checking for the Wasm target...
# [INFO]: 🌀  Compiling to Wasm...
#     Finished `release` profile [optimized] target(s) in 0.01s
# [INFO]: ⬇️  Installing wasm-bindgen...
# [INFO]: Optimizing wasm binaries with `wasm-opt`...
# [INFO]: ✨   Done in 0.36s
# [INFO]: 📦   Your wasm pkg is ready to publish at ... jsonc-to-json/wasm/jsonc_to_json/pkg.
# ✅ Embedded WASM binary to ... jsonc-to-json/src/wasm-bytes.js (160 lines)
# 
# > jsonc-to-json@0.0.1 build
# ...
# src/jsonc-to-json.js → dist/jsonc-to-json.js...
# created dist/jsonc-to-json.js in 29ms
# src/jsonc-to-json.js → docs/jsonc-to-json.js...
# created docs/jsonc-to-json.js in 9ms
# ✅ Build succeeded!
```

### Preview the build

```bash
# Check if static-server is installed globally in nvm's current Node version.
static-server --version
# zsh: command not found: static-server

# Install static-server.
npm install --global static-server
static-server --version
# added 13 packages in 1s
# static-server 2.2.1

# Serve the docs/ folder to preview the live demo, via npm.
npm run preview
# ...
# * Serving files at: http://localhost:9080
# * Press Ctrl+C to shutdown.

# Or serve docs/ directly with static-server.
static-server --no-cache docs
# ...
```

Visit <http://localhost:9080/> (without 'docs/') to check the live demo works.

### Check types

```bash
# Check tsc is installed.
tsc --version
# zsh: command not found: tsc

# Install TypeScript globally in nvm's current Node version.
npm install --global typescript
tsc --version
# added 1 package in 709ms
# Version 5.9.3

# Check for type-errors - see comments in tsconfig.json for more information
# about this repo's use of JSDoc-types instead of .ts files.
npm run check-types
# ...
# ✅ No type-errors found!
```

### JavaScript unit tests

These should be exactly equivalent to the WASM (Rust) unit tests.

```bash
# Run the JS unit tests via npm.
npm run test:js
# ...
# ✅ All JS tests passed!

# Or run the JS unit tests directly with node.
node test.js
# ...
```

### Benchmark and preflight, before each commit

```bash
# Run a preflight check, before committing code:
# JS test - type check - JS and WASM build - WASM test.
npm run ok
# ...
# ✅ Build succeeded!

# Run Node.js benchmarks, and save the report as an HTML file.
npm run bench
# ...
# 📊 Benchmark report saved to docs/bench-1.2.3.html
```

Benchmarking compares the JavaScript `{ useWasm: 'never' }` and Rust/WASM
`{ useWasm: 'always' }` implementations across four datasets (trivial, small,
large and huge). Each dataset is transformed multiple times per implementation,
and the aggregated results are written to
`docs/bench-<package-version>.html`, to help track performance across releases.

`npm run bench` runs `npm run build` first, to ensure the embedded WASM bundle
is up to date.

Prefer a browser-side comparison? Then open <http://localhost:9080/bench.html>
(after running `npm run preview`) to run the same benchmark suites in your
current browser. That page is also available online at
<https://richplastow.com/jsonc-to-json/bench.html>.

### Develop

```bash
# Check that static-server is installed globally in nvm's current Node version.
static-server --version
# static-server 2.2.1

# Serve the top-level folder to use src/ code in the live demo.
npm run dev
# ...
# * Serving files at: http://localhost:9080
# * Press Ctrl+C to shutdown.

# Or serve the top-level folder directly with static-server.
static-server --no-cache .
# ...
```

Visit <http://localhost:9080/docs/> - there's no hot-reloading, so refresh the
browser manually to see changes.

> [!TIP]
> `static-server`'s `--no-cache` makes sure you're always loading up-to-date
> source files during development.

## Rust and WASM setup, install, build, test and develop

The repository contains a companion Rust crate under `wasm/jsonc_to_json/` with
the same pure helpers plus a small native CLI.

### Set up the Rust and WASM toolchain, and install wasm-pack

```bash
# Check if you have cargo and rustup installed.
cargo --version
rustup --version
# zsh: command not found: cargo
# zsh: command not found: rustup

# Install cargo and rustup if you don't have them already.
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
# ...
# 1) Proceed with standard installation (default - just press enter)
# ...
# To configure your current shell, you need to source
# the corresponding env file under $HOME/.cargo.
# 
# This is usually done by running one of the following (note the leading DOT):
# . "$HOME/.cargo/env"            # For sh/bash/zsh/ash/dash/pdksh
# source "$HOME/.cargo/env.fish"  # For fish
# source $"($nu.home-path)/.cargo/env.nu"  # For nushell

# Permanently add cargo to your PATH.
. "$HOME/.cargo/env"
source $HOME/.cargo/env
cargo --version
rustup --version
# cargo 1.92.0 (344c4567c 2025-10-21)
# rustup 1.28.2 (e4f3ad6f8 2025-04-28)
# info: This is the version for the rustup toolchain manager, not the rustc compiler.
# info: The currently active `rustc` version is `rustc 1.92.0 (ded5c06cf 2025-12-08)`

# Add the WASM target and install wasm-pack.
rustup target add wasm32-unknown-unknown
# info: component 'rust-std' for target 'wasm32-unknown-unknown' is up to date
cargo install wasm-pack
#     Updating crates.io index
#      Ignored package `wasm-pack v0.13.1` is already installed, use --force to override
wasm-pack --version
# wasm-pack 0.13.1
```

### Compile the WASM bundle and run tests

```bash
cd wasm/jsonc_to_json
wasm-pack build --target web --out-dir pkg
# [INFO]: 🎯  Checking for the Wasm target...
# [INFO]: 🌀  Compiling to Wasm...
#     Finished `release` profile [optimized] target(s) in 0.02s
# [INFO]: ⬇️  Installing wasm-bindgen...
# [INFO]: Optimizing wasm binaries with `wasm-opt`...
# [INFO]: ✨   Done in 0.40s
# [INFO]: 📦   Your wasm pkg is ready to publish at ... jsonc-to-json/wasm/jsonc_to_json/pkg.

# Embed the freshly built .wasm as base64 for the synchronous JS loader.
cd ../..
npm run prebuild
# ...
# ✅ Embedded WASM binary to ... /src/wasm-bytes.js (160 lines)
```

### WASM unit tests

These should be exactly equivalent to the JavaScript unit tests.

```bash
# Run the WASM unit tests via npm.
npm run test:wasm
# ...
# ✅ All WASM tests passed!

# Or run the WASM unit tests directly with cargo`.
cargo test --release
#    Compiling yansi v1.0.1
# ...
# running 16 tests
# ...
# test result: ok. 16 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
# ...
```

> [!NOTE]
> The loader falls back to the JavaScript implementation if the embedded WASM
> fails to initialise, but `useWasm: 'always'` will throw so you notice the
> problem early.

### Run the native Rust CLI

```bash
cd wasm/jsonc_to_json
cargo run --release --bin cli '{/* comment */"key":1,}'
#    Compiling wasm-bindgen-shared v0.2.106
#    Compiling unicode-ident v1.0.22
#    Compiling once_cell v1.21.3
#    Compiling cfg-if v1.0.4
#    Compiling wasm-bindgen v0.2.106
#    Compiling jsonc_to_json v0.1.0 ( ... jsonc-to-json/wasm/jsonc_to_json)
#     Finished `release` profile [optimized] target(s) in 1.54s
#      Running `target/release/cli '{/* comment */"key":1,}'`
# {"key":1}

# Or pipe data through stdin.
cargo run --release --bin cli < example.jsonc > example.json
```
