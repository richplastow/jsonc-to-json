#!/usr/bin/env node

import { stripComments } from './strip-comments.js';
import { removeTrailingCommas } from './remove-trailing-commas.js';
import { removeBlankLines } from './remove-blank-lines.js';
import { getWasmApi } from './wasm-loader.js';

const DEFAULT_WASM_THRESHOLD = 1000;

/**
 * @typedef {Object} JsoncToJsonOptions
 * @property {'always'|'auto'|'never'} [useWasm]
 * @property {(impl: 'wasm'|'js') => void} [onImplementationUsed] - Testing hook
 */

/**
 * Transforms JSONC (JSON with comments) into JSON by stripping comments,
 * removing trailing commas, and collapsing blank lines.
 * @param {string} jsoncString
 * @param {JsoncToJsonOptions} [options]
 * @returns {string}
 */
export const jsoncToJson = (jsoncString, options = {}) => {
    const mode = normalizeUseWasm(options.useWasm);
    const shouldUseWasm =
        mode === 'always'
            || (
                mode === 'auto'
                && typeof jsoncString === 'string'
                && jsoncString.length >= DEFAULT_WASM_THRESHOLD
            );

    if (shouldUseWasm) {
        const wasm = getWasmApi();
        if (wasm) {
            options.onImplementationUsed?.('wasm');
            return wasm.jsoncToJson(jsoncString);
        }
        if (mode === 'always') throw new Error(
            'Rust WASM backend was requested but is unavailable. Rebuild the wasm package to enable it.');
    }

    options.onImplementationUsed?.('js');
    return runJavaScriptPipeline(jsoncString);
};

const runJavaScriptPipeline = (input) => {
    const withoutComments = stripComments(input);
    const withoutTrailingCommas = removeTrailingCommas(withoutComments);
    return removeBlankLines(withoutTrailingCommas);
};

const normalizeUseWasm = (value) => {
    if (value === 'always' || value === 'auto' || value === 'never') {
        return value;
    }
    return 'auto';
};

// CLI functionality - check if this module is being run from the command line.
if (typeof process === 'object' && Array.isArray(process.argv)) {
    const [, executablePath, jsoncPath] = process.argv;
    if (executablePath && executablePath.endsWith('jsonc-to-json.js')) {
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
