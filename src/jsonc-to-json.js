#!/usr/bin/env node

import { stripComments } from './strip-comments.js';
import { removeTrailingCommas } from './remove-trailing-commas.js';
import { removeBlankLines } from './remove-blank-lines.js';

/**
 * Transforms JSONC (JSON with comments) into JSON by stripping comments,
 * removing trailing commas, and collapsing blank lines.
 * @param {string} jsoncString
 * @returns {string}
 */
export const jsoncToJson = (jsoncString) => {
    const withoutComments = stripComments(jsoncString);
    const withoutTrailingCommas = removeTrailingCommas(withoutComments);
    return removeBlankLines(withoutTrailingCommas);
};

// CLI functionality - check if this module is being run from the command line.
if (typeof process === 'object' && Array.isArray(process.argv)) {
    const [, executablePath, jsoncPath] = process.argv;
    if (executablePath && executablePath.endsWith('jsonc-to-json.js')) {
        if (jsoncPath) {
            const jsonContent = jsoncToJson(jsoncPath);
            console.log(jsonContent);
        } else {
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
