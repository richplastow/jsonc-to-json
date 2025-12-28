#!/usr/bin/env node

import { stripComments } from './strip-comments.js';
import { removeTrailingCommas } from './remove-trailing-commas.js';
import { removeBlankLines } from './remove-blank-lines.js';
import { getWasmApi } from './wasm-loader.js';

const BUILD_VARIANT = 'js-and-wasm'; // may have ".min" appended during build
const PACKAGE_VERSION = '1.1.0'; // will be checked during build
const WASM_THRESHOLD = 1000;

/**
 * @typedef {Object} JsoncToJsonOptions
 * @property {boolean} [debug] - Optional debug flag, false by default
 * @property {'always'|'auto'|'never'} [useWasm] - When to use WASM
 */

/**
 * @typedef {Object} JsoncToJsonDebugOutput
 * @property {string} buildVariant - The build variant used, e.g. 'js-only.min'
 * @property {'js'|'wasm'} implementationUsed - Whether JavaScript or WASM was used to process this JSON output
 * @property {number} lengthInput - The length of the input JSONC string
 * @property {number} lengthOutput - The length of the output JSON string
 * @property {string} json - The JSON output, with comments and trailing commas removed
 * @property {string} processingTimeMs - Time taken to process the input, in milliseconds, to 3 fixed decimal places
 * @property {string} version - The jsonc-to-json package version
 */

/**
 * Transforms JSONC (JSON with comments) into JSON by stripping comments,
 * removing trailing commas, and collapsing blank lines.
 * @param {string} jsoncString
 * @param {JsoncToJsonOptions} [options]
 * @returns {string|JsoncToJsonDebugOutput}
 */
export const jsoncToJson = (jsoncString, options = {}) => {
    let startTime;
    if (options.debug) startTime = performance.now();

    const useWasm = normalizeUseWasm(options.useWasm);
    const shouldUseWasm =
        useWasm === 'always'
            || (
                useWasm === 'auto'
                && typeof jsoncString === 'string'
                && jsoncString.length >= WASM_THRESHOLD
            );

    let json;
    if (shouldUseWasm) {
        const wasm = getWasmApi();
        if (wasm) {
            json = wasm.jsoncToJson(jsoncString);
        } else if (useWasm === 'always') throw new Error(
            'Rust WASM backend was requested but is unavailable. Rebuild the wasm package to enable it.');
    } else {
        json = runJavaScriptPipeline(jsoncString);
    }

    // Usually, return just the JSON output.
    if (!options.debug) return json;

    // In debug mode, return runtime info along with the JSON output.
    const processingTimeMs = performance.now() - startTime;
    return {
        buildVariant: BUILD_VARIANT,
        implementationUsed: shouldUseWasm ? 'wasm' : 'js',
        json,
        lengthInput: jsoncString.length,
        lengthOutput: json.length,
        processingTimeMs: processingTimeMs.toFixed(3),
        version: PACKAGE_VERSION,
    };
};

const runJavaScriptPipeline = (input) => {
    const withoutComments = stripComments(input);
    const withoutTrailingCommas = removeTrailingCommas(withoutComments);
    return removeBlankLines(withoutTrailingCommas);
};

const normalizeUseWasm = (value) => {
    switch (value) {
        case 'always':
        case 'auto':
        case 'never':
            return value;
        default:
            return 'auto';
    }
};

// CLI functionality - check if this module is being run from the command line.
if (typeof process === 'object' && Array.isArray(process.argv)) {
    const [, executablePath, jsoncPath] = process.argv;
    if (executablePath && executablePath.endsWith('jsonc-to-json--js-and-wasm.js')) {
        if (jsoncPath) { // process the argument as a JSONC string
            const jsonContent = jsoncToJson(jsoncPath);
            console.log(jsonContent);
        } else { // read from stdin
            let input = '';
            process.stdin.on('data', (chunk) => {
                input += chunk;
            });
            process.stdin.on('end', () => {
                const jsonContent = jsoncToJson(input);
                console.log(jsonContent);
            });
        }
    }
}
