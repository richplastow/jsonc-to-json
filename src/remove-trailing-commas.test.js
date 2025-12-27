import { strictEqual as eq } from 'node:assert';
import { removeTrailingCommas } from './remove-trailing-commas.js';

// Removes trailing commas in objects.
eq(
  removeTrailingCommas(`{
  "a": 1,
}`),
  `{
  "a": 1
}`
);

// Removes trailing commas in arrays.
eq(
  removeTrailingCommas(`[
  1,
  2,
]`),
  `[
  1,
  2
]`
);

// Keeps inner commas that are followed by values.
eq(
  removeTrailingCommas(`{
  "a": [1, 2],
  "b": 3
}`),
  `{
  "a": [1, 2],
  "b": 3
}`
);

// Leaves commas inside strings untouched.
eq(
  removeTrailingCommas('{"text":",","other":"]"}'),
  '{"text":",","other":"]"}'
);

console.log('removeTrailingCommas() tests passed.');
