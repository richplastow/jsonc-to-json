import { strictEqual as eq } from 'node:assert';
import { stripComments } from './strip-comments.js';

// Removes line comments and trailing inline whitespace.
eq(
  stripComments('{"a":1, // comment\n"b":2}\n'),
  '{"a":1,\n"b":2}\n'
);

// Removes block comments while preserving surrounding newlines.
eq(
  stripComments('before/* comment */\nafter'),
  'before\nafter'
);

// Leaves strings with comment-like sequences untouched.
eq(
  stripComments('{"a":"This is not // a comment","b":"/* nor this */"}'),
  '{"a":"This is not // a comment","b":"/* nor this */"}'
);

// Handles escaped characters inside strings without terminating early.
eq(
  stripComments('{"path":"C\\tmp\\file","text":"Quote: \\\"//\\\""}'),
  '{"path":"C\\tmp\\file","text":"Quote: \\\"//\\\""}'
);

console.log('stripComments() tests passed.');
