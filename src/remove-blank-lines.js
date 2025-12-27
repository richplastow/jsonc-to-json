/**
 * Drops lines that contain only whitespace so the resulting JSON is compact
 * without empty rows left by removed comments.
 * @param {string} input
 * @returns {string}
 */
export const removeBlankLines = (input) => {
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
