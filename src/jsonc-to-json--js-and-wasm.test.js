import { strictEqual as eq } from 'node:assert';
import { jsoncToJson as fn } from './jsonc-to-json--js-and-wasm.js';

/**
 * @typedef {import('./jsonc-to-json--js-and-wasm.js').JsoncToJsonDebugOutput} JsoncToJsonDebugOutput
 */

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
let result = /** @type {JsoncToJsonDebugOutput} */ (fn(`{
  "a": 1,
  "b": 2,
}`, { useWasm: 'never', debug: true }));
eq(result.json, `{
  "a": 1,
  "b": 2
}`);
eq(result.implementationUsed, 'js', 'useWasm: never should use JS implementation');

// WASM "always" forces the Rust pipeline even on small inputs.
result = /** @type {JsoncToJsonDebugOutput} */ (fn(`{
  "a": 1, // inline comment
}`, { useWasm: 'always', debug: true }));
eq(result.json, `{
  "a": 1
}`);
eq(result.implementationUsed, 'wasm', 'useWasm: always should use WASM implementation');

// WASM "auto" uses JS for inputs below 1000 characters.
const input999 = '{"a":' + ' '.repeat(992) + '1}'; // Exactly 999 chars
eq(input999.length, 999, 'Input should be exactly 999 characters');
result = /** @type {JsoncToJsonDebugOutput} */
  (fn(input999, { useWasm: 'auto', debug: true }));
eq(result.json, '{"a":' + ' '.repeat(992) + '1}');
eq(result.implementationUsed, 'js', 'useWasm: auto should use JS for 999-char input');

// WASM "auto" uses WASM for inputs at or above 1000 characters.
const input1000 = '{"a":' + ' '.repeat(993) + '1}'; // Exactly 1000 chars
eq(input1000.length, 1000, 'Input should be exactly 1000 characters');
result = /** @type {JsoncToJsonDebugOutput} */
  (fn(input1000, { useWasm: 'auto', debug: true }));
eq(result.json, '{"a":' + ' '.repeat(993) + '1}');
eq(result.implementationUsed, 'wasm', 'useWasm: auto should use WASM for 1000-char input');

// Debug mode returns an object with correct properties.
result = /** @type {JsoncToJsonDebugOutput} */
  (fn('{"a":1}', { debug: true }));
eq(typeof result, 'object', 'Debug mode should return an object');
eq(typeof result.buildVariant, 'string', 'buildVariant should be a string');
eq(typeof result.implementationUsed, 'string', 'implementationUsed should be a string');
eq(typeof result.json, 'string', 'json should be a string');
eq(typeof result.lengthInput, 'number', 'lengthInput should be a number');
eq(typeof result.lengthOutput, 'number', 'lengthOutput should be a number');
eq(typeof result.processingTimeMs, 'string', 'processingTimeMs should be a string');
eq(typeof result.version, 'string', 'version should be a string');

// Debug mode: buildVariant should match expected pattern.
eq(result.buildVariant.startsWith('js-and-wasm'), true, 'buildVariant should start with js-and-wasm');

// Debug mode: implementationUsed should be either 'js' or 'wasm'.
eq(['js', 'wasm'].includes(result.implementationUsed), true, 'implementationUsed should be js or wasm');

// Debug mode: version should be a valid semver string.
eq(/^\d+\.\d+\.\d+$/.test(result.version), true, 'version should be valid semver');

// Debug mode: processingTimeMs should be a number string with 3 decimal places.
eq(/^\d+\.\d{3}$/.test(result.processingTimeMs), true, 'processingTimeMs should have 3 decimal places');
eq(parseFloat(result.processingTimeMs) >= 0, true, 'processingTimeMs should be non-negative');

// Debug mode: lengthInput and lengthOutput should match actual lengths.
result = /** @type {JsoncToJsonDebugOutput} */
  (fn('{"a": 1, "b": 2,}', { debug: true }));
eq(result.lengthInput, '{"a": 1, "b": 2,}'.length, 'lengthInput should match input length');
eq(result.lengthOutput, result.json.length, 'lengthOutput should match output length');

// Debug mode: json output should be correct.
eq(result.json, '{"a": 1, "b": 2}', 'json should be processed correctly');

// Debug mode: with comments and trailing commas.
result = /** @type {JsoncToJsonDebugOutput} */ (fn(`{
  "key": "value", // comment
  "num": 42,
}`, { debug: true }));
eq(result.json, `{
  "key": "value",
  "num": 42
}`, 'json should strip comments and trailing commas');

// Debug mode with useWasm: 'never' forces JS implementation.
result = /** @type {JsoncToJsonDebugOutput} */
  (fn('{"x":1}', { debug: true, useWasm: 'never' }));
eq(result.implementationUsed, 'js', 'useWasm never should force JS');
eq(result.json, '{"x":1}', 'json should be correct');

// Debug mode with useWasm: 'always' forces WASM implementation.
result = /** @type {JsoncToJsonDebugOutput} */
  (fn('{"x":1}', { debug: true, useWasm: 'always' }));
eq(result.implementationUsed, 'wasm', 'useWasm always should force WASM');
eq(result.json, '{"x":1}', 'json should be correct');

// Debug mode: empty string input.
result = /** @type {JsoncToJsonDebugOutput} */
  (fn('', { debug: true }));
eq(result.json, '', 'empty input should produce empty output');
eq(result.lengthInput, 0, 'lengthInput should be 0');
eq(result.lengthOutput, 0, 'lengthOutput should be 0');

// Debug mode: minimal valid JSON.
result = /** @type {JsoncToJsonDebugOutput} */
  (fn('0', { debug: true }));
eq(result.json, '0', 'minimal JSON should work');
eq(result.lengthInput, 1, 'lengthInput should be 1');
eq(result.lengthOutput, 1, 'lengthOutput should be 1');

// Debug mode: large input with auto mode uses WASM.
const largeInput = '{"data":' + ' '.repeat(1000) + '1}';
result = /** @type {JsoncToJsonDebugOutput} */
  (fn(largeInput, { debug: true, useWasm: 'auto' }));
eq(result.implementationUsed, 'wasm', 'large input with auto should use WASM');
eq(result.lengthInput, largeInput.length, 'lengthInput should match large input length');

// Debug mode: small input with auto mode uses JS.
const smallInput = '{"x":1}';
result = /** @type {JsoncToJsonDebugOutput} */
  (fn(smallInput, { debug: true, useWasm: 'auto' }));
eq(result.implementationUsed, 'js', 'small input with auto should use JS');
eq(result.lengthInput, smallInput.length, 'lengthInput should match small input length');

// Debug mode: complex nested structure.
result = /** @type {JsoncToJsonDebugOutput} */ (fn(`{
  "users": [
    {"name": "Alice", "age": 30,}, // trailing comma
    {"name": "Bob", "age": 25}, // no trailing comma
  ],
  "count": 2, // inline comment
}`, { debug: true }));
eq(result.json, `{
  "users": [
    {"name": "Alice", "age": 30},
    {"name": "Bob", "age": 25}
  ],
  "count": 2
}`, 'complex structure should be processed correctly');

// Debug mode: string with comment-like content.
result = /** @type {JsoncToJsonDebugOutput} */
  (fn('{"msg":"This // is not a comment"}', { debug: true }));
eq(result.json, '{"msg":"This // is not a comment"}', 'comment-like strings should be preserved');

// Debug mode: multiple line and block comments.
result = /** @type {JsoncToJsonDebugOutput} */ (fn(`{
  // Line comment 1
  "a": 1, /* Block comment 1 */
  // Line comment 2
  "b": 2 /* Block comment 2 */
  // Line comment 3
}`, { debug: true }));
eq(result.json, `{
  "a": 1,
  "b": 2
}`, 'multiple comments should be stripped');

// Debug mode: processingTimeMs should be reasonable (< 100ms for small input).
result = /** @type {JsoncToJsonDebugOutput} */
  (fn('{"test":123}', { debug: true }));
const timeMs = parseFloat(result.processingTimeMs);
eq(timeMs < 100, true, 'processing time should be reasonable for small input');
eq(timeMs >= 0, true, 'processing time should be non-negative');

// Debug mode: lengthOutput should be less than or equal to lengthInput.
// (Comments and whitespace removal can only reduce or maintain length)
result = /** @type {JsoncToJsonDebugOutput} */
  (fn('{"a":1, "b":2,}', { debug: true }));
eq(result.lengthOutput <= result.lengthInput, true, 'output should not be longer than input');

// Debug mode: buildVariant should not be empty.
result = /** @type {JsoncToJsonDebugOutput} */
  (fn('{}', { debug: true }));
eq(result.buildVariant.length > 0, true, 'buildVariant should not be empty');

// Debug mode: with escaped strings.
const escapedInput = String.raw`{"path":"C:\\Users\\test","quote":"He said: \"Hello\""}`;
result = /** @type {JsoncToJsonDebugOutput} */
  (fn(escapedInput, { debug: true }));
eq(result.json, escapedInput, 'escaped strings should remain intact');
eq(result.lengthInput, escapedInput.length, 'lengthInput should match escaped input length');

// Debug mode: array with trailing comma.
result = /** @type {JsoncToJsonDebugOutput} */
  (fn('[1,2,3,]', { debug: true }));
eq(result.json, '[1,2,3]', 'array trailing comma should be removed');
eq(result.lengthOutput, 7, 'output length should be correct');

// Debug mode: nested arrays and objects with comments.
result = /** @type {JsoncToJsonDebugOutput} */ (fn(`{
  "matrix": [
    [1, 2,], // row 1
    [3, 4], // row 2
  ], // end matrix
}`, { debug: true }));
eq(result.json, `{
  "matrix": [
    [1, 2],
    [3, 4]
  ]
}`, 'nested structures with comments should work');

// Debug mode: all property values should be defined.
result = /** @type {JsoncToJsonDebugOutput} */
  (fn('{"test":true}', { debug: true }));
eq(result.buildVariant !== undefined, true, 'buildVariant should be defined');
eq(result.implementationUsed !== undefined, true, 'implementationUsed should be defined');
eq(result.json !== undefined, true, 'json should be defined');
eq(result.lengthInput !== undefined, true, 'lengthInput should be defined');
eq(result.lengthOutput !== undefined, true, 'lengthOutput should be defined');
eq(result.processingTimeMs !== undefined, true, 'processingTimeMs should be defined');
eq(result.version !== undefined, true, 'version should be defined');

console.log('All jsoncToJson() tests passed.');
