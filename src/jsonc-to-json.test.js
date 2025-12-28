import { strictEqual as eq } from 'node:assert';
import { jsoncToJson as fn } from './jsonc-to-json.js';

// Very simple cases, without comments or trailing commas.
eq(fn(''), '');
eq(fn('123'), '123');
eq(fn('null'), 'null');
eq(fn('true'), 'true');
eq(fn('"string"'), '"string"');
eq(fn('{"a":1,"b":2}'), '{"a":1,"b":2}');
eq(fn('[1, null, true]'), '[1, null, true]');

// Simple cases with `//` comments on their own lines, and no trailing commas.
eq(
  fn(`
// This is a comment
{
  // Another comment
  "a": 1,
  "b": 2
}
// End comment
`),
`{
  "a": 1,
  "b": 2
}
`
);

// Simple cases with `/* ... */` comments on their own lines, and no trailing commas.
eq(
  fn(`
/* This is a comment */
{
  /* Another comment */
  "a": 1,
  "b": 2
}
/* End comment */
`),
`{
  "a": 1,
  "b": 2
}
`
);

// Simple cases with `//` comments at end of lines, and no trailing commas.
eq(
  fn(`{
  "a": 1, // Comment for a
  "b": 2  // Comment for b
}`),
`{
  "a": 1,
  "b": 2
}`
);

// Simple cases with `/* ... */` comments at end of lines, and no trailing commas.
eq(
  fn(`{
  "a": 1, /* Comment for a */
  "b": 2  /* Comment for b */
}`),
`{
  "a": 1,
  "b": 2
}`
);

// Trailing commas and no comments.
eq(
  fn(`{
  "a": 1,
  "b": 2,
}`),
`{
  "a": 1,
  "b": 2
}`
);
eq(
  fn(`[
  1,
  2,
]`),
`[
  1,
  2
]`
);

// All kinds of comments and trailing commas.
eq(
  fn(`
// Start comment
{
  "a": 1, // Comment for a
  "b": 2, /* Comment for b */
} // End comment
`),
`{
  "a": 1,
  "b": 2
}
`
);
eq(
  fn(`[
  1, // Comment for 1
  2, /* Comment for 2 */
] // End comment
`),
`[
  1,
  2
]
`
);

// Strings that contain comment-like sequences.
eq(
  fn(`{
  "a": "This is not a // comment",
  "b": "This is not a /* comment */ either",
}`),
`{
  "a": "This is not a // comment",
  "b": "This is not a /* comment */ either"
}`
);

// Strings with escaped quotes and backslashes remain untouched.
const escapedString = String.raw`{
  "path": "C\\tmp\\file",
  "quote": "He said: \"/* not a comment */\""
}`;
eq(fn(escapedString), escapedString);

// WASM "never" enforces the JavaScript fallback explicitly.
let usedImpl = null;
eq(
  fn(`{
  "a": 1,
  "b": 2,
}`, { useWasm: 'never', onImplementationUsed: (impl) => { usedImpl = impl; } }),
`{
  "a": 1,
  "b": 2
}`
);
eq(usedImpl, 'js', 'useWasm: never should use JS implementation');

// WASM "always" forces the Rust pipeline even on small inputs.
usedImpl = null;
eq(
  fn(`{
  "a": 1, // inline comment
}`, { useWasm: 'always', onImplementationUsed: (impl) => { usedImpl = impl; } }),
`{
  "a": 1
}`
);
eq(usedImpl, 'wasm', 'useWasm: always should use WASM implementation');

// WASM "auto" uses JS for inputs below 1000 characters.
usedImpl = null;
const input999 = '{"a":' + ' '.repeat(992) + '1}'; // Exactly 999 chars
eq(input999.length, 999, 'Input should be exactly 999 characters');
eq(
  fn(input999, { useWasm: 'auto', onImplementationUsed: (impl) => { usedImpl = impl; } }),
  '{"a":' + ' '.repeat(992) + '1}'
);
eq(usedImpl, 'js', 'useWasm: auto should use JS for 999-char input');

// WASM "auto" uses WASM for inputs at or above 1000 characters.
usedImpl = null;
const input1000 = '{"a":' + ' '.repeat(993) + '1}'; // Exactly 1000 chars
eq(input1000.length, 1000, 'Input should be exactly 1000 characters');
eq(
  fn(input1000, { useWasm: 'auto', onImplementationUsed: (impl) => { usedImpl = impl; } }),
  '{"a":' + ' '.repeat(993) + '1}'
);
eq(usedImpl, 'wasm', 'useWasm: auto should use WASM for 1000-char input');

console.log('All jsoncToJson() tests passed.');
