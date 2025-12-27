#!/usr/bin/env node
/**
 * Removes both line and block comments from a JSONC string while keeping
 * string literals intact and trimming inline whitespace before comments.
 * @param {string} input
 * @returns {string}
 */
const stripComments = (input) => {
  const chars = [];
  const { length } = input;
  let i = 0;
  let inString = false;
  let stringDelimiter = '"';

  while (i < length) {
    const ch = input[i];

    if (inString) {
      chars.push(ch);
      if (ch === '\\' && i + 1 < length) {
        chars.push(input[i + 1]);
        i += 2;
        continue;
      }
      if (ch === stringDelimiter) {
        inString = false;
      }
      i += 1;
      continue;
    }

    if (ch === '"' || ch === '\'') {
      inString = true;
      stringDelimiter = ch;
      chars.push(ch);
      i += 1;
      continue;
    }

    if (ch === '/' && i + 1 < length) {
      const next = input[i + 1];

      if (next === '/') {
        trimTrailingInlineWhitespace(chars);
        i += 2;
        while (i < length) {
          const commentChar = input[i];
          if (commentChar === '\r') {
            chars.push('\r');
            i += 1;
            if (input[i] === '\n') {
              chars.push('\n');
              i += 1;
            }
            break;
          }
          if (commentChar === '\n') {
            chars.push('\n');
            i += 1;
            break;
          }
          i += 1;
        }
        continue;
      }

      if (next === '*') {
        trimTrailingInlineWhitespace(chars);
        i += 2;
        while (i < length) {
          const commentChar = input[i];
          if (commentChar === '*' && input[i + 1] === '/') {
            i += 2;
            break;
          }
          if (commentChar === '\r') {
            chars.push('\r');
            i += 1;
            if (input[i] === '\n') {
              chars.push('\n');
              i += 1;
            }
            continue;
          }
          if (commentChar === '\n') {
            chars.push('\n');
            i += 1;
            continue;
          }
          i += 1;
        }
        continue;
      }
    }

    chars.push(ch);
    i += 1;
  }

  return chars.join('');
};

/**
 * Removes inline spaces/tabs that precede a comment so lines do not retain
 * dangling whitespace once the comment is stripped.
 * @param {string[]} chars
 */
const trimTrailingInlineWhitespace = (chars) => {
  let idx = chars.length - 1;
  while (idx >= 0) {
    const last = chars[idx];
    if (last === ' ' || last === '\t') {
      chars.pop();
      idx -= 1;
      continue;
    }
    if (last === '\n' || last === '\r') {
      break;
    }
    break;
  }
};

/**
 * Removes commas that directly precede closing braces or brackets while
 * respecting string literals.
 * @param {string} input
 * @returns {string}
 */
const removeTrailingCommas = (input) => {
  const chars = [];
  const { length } = input;
  let i = 0;
  let inString = false;
  let stringDelimiter = '"';

  while (i < length) {
    const ch = input[i];

    if (inString) {
      chars.push(ch);
      if (ch === '\\' && i + 1 < length) {
        chars.push(input[i + 1]);
        i += 2;
        continue;
      }
      if (ch === stringDelimiter) {
        inString = false;
      }
      i += 1;
      continue;
    }

    if (ch === '"' || ch === '\'') {
      inString = true;
      stringDelimiter = ch;
      chars.push(ch);
      i += 1;
      continue;
    }

    if (ch === ',') {
      const lookaheadIndex = nextNonWhitespaceIndex(input, i + 1);
      if (lookaheadIndex === -1 || input[lookaheadIndex] === '}' || input[lookaheadIndex] === ']') {
        i += 1;
        continue;
      }
    }

    chars.push(ch);
    i += 1;
  }

  return chars.join('');
};

/**
 * Finds the index of the next non-whitespace character.
 * @param {string} input
 * @param {number} start
 * @returns {number}
 */
const nextNonWhitespaceIndex = (input, start) => {
  const { length } = input;
  let idx = start;
  while (idx < length) {
    const ch = input[idx];
    if (ch !== ' ' && ch !== '\t' && ch !== '\n' && ch !== '\r') {
      return idx;
    }
    idx += 1;
  }
  return -1;
};

/**
 * Drops lines that contain only whitespace so the resulting JSON is compact
 * without empty rows left by removed comments.
 * @param {string} input
 * @returns {string}
 */
const removeBlankLines = (input) => {
  const output = [];
  const lineBuffer = [];
  const { length } = input;
  let i = 0;
  let hasContent = false;

  while (i < length) {
    const ch = input[i];

    if (ch === '\r' || ch === '\n') {
      const newlineChars = [ch];
      if (ch === '\r' && i + 1 < length && input[i + 1] === '\n') {
        newlineChars.push('\n');
        i += 1;
      }
      if (hasContent) {
        output.push(...lineBuffer, ...newlineChars);
      }
      lineBuffer.length = 0;
      hasContent = false;
      i += 1;
      continue;
    }

    lineBuffer.push(ch);
    if (ch !== ' ' && ch !== '\t') {
      hasContent = true;
    }
    i += 1;
  }

  if (hasContent) {
    output.push(...lineBuffer);
  }

  return output.join('');
};

/**
 * Transforms JSONC (JSON with comments) into JSON by stripping comments,
 * removing trailing commas, and collapsing blank lines.
 * @param {string} jsoncString
 * @returns {string}
 */
const jsoncToJson = (jsoncString) => {
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

export { jsoncToJson };
