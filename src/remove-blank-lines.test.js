import { strictEqual as eq } from 'node:assert';
import { removeBlankLines } from './remove-blank-lines.js';

// Drops completely empty lines.
eq(
  removeBlankLines(`{

  "a": 1
}

`),
  `{
  "a": 1
}
`
);

// Removes lines that only contain spaces.
eq(
  removeBlankLines('line1\n    \nline2'),
  'line1\nline2'
);

// Keeps indentation on non-empty lines.
eq(
  removeBlankLines('  indented\n\nnext'),
  '  indented\nnext'
);

console.log('removeBlankLines() tests passed.');
