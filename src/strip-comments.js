/**
 * Removes both line and block comments from a JSONC string while keeping
 * string literals intact and trimming inline whitespace before comments.
 * @param {string} input
 * @returns {string}
 */
export const stripComments = (input) => {
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
