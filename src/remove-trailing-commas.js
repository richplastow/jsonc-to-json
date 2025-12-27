/**
 * Removes commas that directly precede closing braces or brackets while
 * respecting string literals.
 * @param {string} input
 * @returns {string}
 */
export const removeTrailingCommas = (input) => {
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
