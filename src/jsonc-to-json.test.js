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

console.log('All jsoncToJson() tests passed.');
