#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the WASM binary file.
const wasmPath = join(__dirname, '../wasm/jsonc_to_json/pkg/jsonc_to_json_bg.wasm');
const wasmBytes = readFileSync(wasmPath);

// Convert to base64.
const base64 = wasmBytes.toString('base64');

// Split into 200-char chunks for better IDE syntax highlighting.
const chunks = [];
for (let i = 0; i < base64.length; i += 200) {
  chunks.push(base64.slice(i, i + 200));
}

// Format as JavaScript string concatenation.
const lines = chunks.map(chunk => `'${chunk}'`).join('\n  + ');

// Write to wasm-bytes.js.
const outputPath = join(__dirname, '../src/wasm-bytes.js');
writeFileSync(outputPath, `export const wasmBase64 = ${lines};\n`);

console.log(`✅ Embedded WASM binary to ${outputPath} (${chunks.length} lines)`);
