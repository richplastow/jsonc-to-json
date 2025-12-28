import {
  initSync as initSyncWasm,
  jsonc_to_json as wasmJsoncToJson,
  remove_blank_lines as wasmRemoveBlankLines,
  remove_trailing_commas as wasmRemoveTrailingCommas,
  strip_comments as wasmStripComments,
} from '../wasm/jsonc_to_json/pkg/jsonc_to_json.js';
import { wasmBase64 } from './wasm-bytes.js';

let wasmReady = false;
let wasmError = null;
let cachedBytes = null;

const decodeWasm = () => {
  if (cachedBytes) {
    return cachedBytes;
  }
  if (typeof Buffer === 'function') {
    cachedBytes = Uint8Array.from(Buffer.from(wasmBase64, 'base64'));
    return cachedBytes;
  }
  const binaryString = typeof atob === 'function'
    ? atob(wasmBase64)
    : globalThis.atob(wasmBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  cachedBytes = bytes;
  return cachedBytes;
};

const ensureWasm = () => {
  if (wasmReady || wasmError) {
    return wasmReady;
  }
  try {
    const bytes = decodeWasm();
    initSyncWasm({ module: bytes });
    wasmReady = true;
    return true;
  } catch (error) {
    wasmError = error;
    return false;
  }
};

/**
 * Returns wasm bindings if instantiation succeeded. Otherwise `null` is
 * returned so callers can gracefully fall back to the JS implementation.
 * @returns {{
 *   jsoncToJson: (input: string) => string,
 *   stripComments: (input: string) => string,
 *   removeTrailingCommas: (input: string) => string,
 *   removeBlankLines: (input: string) => string,
 * } | null}
 */
export const getWasmApi = () => {
  if (!ensureWasm()) {
    return null;
  }
  return {
    jsoncToJson: wasmJsoncToJson,
    stripComments: wasmStripComments,
    removeTrailingCommas: wasmRemoveTrailingCommas,
    removeBlankLines: wasmRemoveBlankLines,
  };
};

/**
 * Exposes the underlying instantiation error, if any, which is helpful for
 * surfacing actionable diagnostics in CLI contexts.
 * @returns {Error|null}
 */
export const getWasmError = () => wasmError;
