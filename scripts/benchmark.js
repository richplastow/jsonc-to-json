#!/usr/bin/env node

import { performance } from 'node:perf_hooks';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { jsoncToJson } from '../src/jsonc-to-json--js-and-wasm.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const docsDir = join(rootDir, 'docs');
const pkg = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
const version = pkg.version;

const DATASETS = [
  { id: 'trivial', label: 'Trivial (single entry)', entries: 1, iterations: 5000 },
  { id: 'small', label: 'Small (~15 KB payload)', entries: 200, iterations: 1000 },
  { id: 'large', label: 'Large (~150 KB payload)', entries: 2000, iterations: 200 },
  { id: 'huge', label: 'Huge (~750 KB payload)', entries: 10000, iterations: 40 },
];

const timestamp = new Date().toISOString();
const nodeVersion = process.version;

ensureWasmAvailable();
mkdirSync(docsDir, { recursive: true });

console.log(`Benchmarking jsonc-to-json v${version}`);
console.log(`Node ${nodeVersion}, ${timestamp}`);

const results = DATASETS.map((dataset) => runBenchmark(dataset));
writeHtmlReport(results);

function ensureWasmAvailable() {
  try {
    jsoncToJson('{"warmup": true, /* comment */ "value": 1,}', { useWasm: 'always' });
  } catch (error) {
    console.error('\nRust WASM backend is unavailable. Run `npm run build` before benchmarking.');
    process.exit(1);
  }
}

function runBenchmark(dataset) {
  const input = buildJsonc(dataset.entries);
  const sizeBytes = Buffer.byteLength(input, 'utf8');
  const sizeChars = input.length;
  console.log(`• ${dataset.label} — ${formatBytes(sizeBytes)} (${dataset.iterations.toLocaleString('en')} iterations per mode)`);
  const js = measurePipeline('js', input, dataset.iterations);
  const wasm = measurePipeline('wasm', input, dataset.iterations);
  const winner = computeWinner(js.average, wasm.average);
  return {
    ...dataset,
    inputSize: { bytes: sizeBytes, chars: sizeChars },
    js,
    wasm,
    winner,
  };
}

function measurePipeline(mode, input, iterations) {
  const options = mode === 'wasm' ? { useWasm: 'always' } : { useWasm: 'never' };
  // Warm up to amortize one-off initialisation costs (especially for WASM).
  jsoncToJson(input, options);
  const samples = [];
  for (let i = 0; i < iterations; i += 1) {
    const start = performance.now();
    jsoncToJson(input, options);
    samples.push(performance.now() - start);
  }
  return summarize(samples);
}

function summarize(samples) {
  let total = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = 0;
  for (const value of samples) {
    total += value;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  const average = total / samples.length;
  return { average, min, max, samples: samples.length };
}

function computeWinner(jsAvg, wasmAvg) {
  const jsFaster = jsAvg <= wasmAvg;
  const faster = jsFaster ? jsAvg : wasmAvg;
  const slower = jsFaster ? wasmAvg : jsAvg;
  const deltaMs = slower - faster;
  const multiplier = faster > 0 ? slower / faster : Infinity;
  return {
    label: jsFaster ? 'JS' : 'WASM',
    deltaMs,
    multiplier,
  };
}

function buildJsonc(entryCount) {
  const lines = [
    '{',
    '  /* Synthetic JSONC payload generated for benchmarking. */',
  ];
  for (let i = 0; i < entryCount; i += 1) {
    lines.push(`  // Entry ${i}`);
    lines.push('  "block": {');
    lines.push(`    "id": ${i}, // inline comment to strip`);
    lines.push(`    "text": "Value ${i}",`);
    lines.push('    "list": [');
    lines.push(`      ${i},`);
    lines.push(`      ${i + 1},`);
    lines.push('    ],');
    lines.push('    /* block comment to strip */');
    lines.push('  },');
  }
  lines.push('}');
  lines.push('');
  return lines.join('\n');
}

function writeHtmlReport(results) {
  const rows = results.map((result) => {
    const jsAvg = formatMs(result.js.average);
    const wasmAvg = formatMs(result.wasm.average);
    const winner = `${result.winner.label} (${formatMultiplier(result.winner.multiplier)}× faster, Δ ${formatMs(result.winner.deltaMs)} ms)`;
    return `        <tr>
            <td>${result.label}</td>
            <td>${formatBytes(result.inputSize.bytes)} (${formatNumber(result.inputSize.chars)} chars)</td>
            <td>${formatNumber(result.iterations)}</td>
            <td>${jsAvg}</td>
            <td>${wasmAvg}</td>
            <td>${winner}</td>
        </tr>`;
  }).join('\n');

  const detailBlocks = results.map((result) => `        <section>
            <h3>${result.label}</h3>
            <p>Input size: ${formatBytes(result.inputSize.bytes)} (${formatNumber(result.inputSize.chars)} characters). Iterations per mode: ${formatNumber(result.iterations)}.</p>
            <ul>
                <li>JS pipeline — avg ${formatMs(result.js.average)} ms (min ${formatMs(result.js.min)} ms, max ${formatMs(result.js.max)} ms)</li>
                <li>WASM pipeline — avg ${formatMs(result.wasm.average)} ms (min ${formatMs(result.wasm.min)} ms, max ${formatMs(result.wasm.max)} ms)</li>
                <li>Winner: ${result.winner.label} (${formatMultiplier(result.winner.multiplier)}× faster on average)</li>
            </ul>
        </section>`).join('\n');

  const outputName = `bench-${version}.html`;
  const outputPath = join(docsDir, outputName);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Technical meta -->
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- CSS -->
    <link rel="stylesheet" href="style.css">

    <!-- Search engine meta -->
    <title>jsonc-to-json v${version} — Node.js benchmarks</title>
    <meta name="description"
        content="Side-by-side comparison of the JavaScript and Rust/WASM
        implementations in Node.js, for trivial, small, large and huge inputs.
        Useful for checking performance differences between Node.js versions,
        and different jsonc-to-json releases.">
    <link rel="author" href="Rich Plastow">

    <!-- Open Graph for social media bots, etc -->
    <meta property="og:type"   content="website">
    <meta property="og:locale" content="en_GB">
    <meta property="og:url"
        content="https://richplastow.com/jsonc-to-json/bench-${version}.html">
    <meta property="og:image"
        content="https://richplastow.com/asset/logo/rich-plastow-logo-1200.png">
    <meta property="og:title" content="jsonc-to-json v${version} — Node.js benchmarks">
    <meta property="og:description"
        content="Side-by-side comparison of the JavaScript and Rust/WASM
        implementations in Node.js, for trivial, small, large and huge inputs.
        Useful for checking performance differences between Node.js versions,
        and different jsonc-to-json releases.">

    <!-- From realfavicongenerator.net -->
    <link rel="apple-touch-icon" sizes="180x180" href="/asset/icon/apple-touch.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/asset/icon/favicon32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/asset/icon/favicon16.png">
    <link rel="manifest" href="manifest.json">
    <link rel="mask-icon" color="#222222" href="/asset/icon/safari-pinned-tab.svg">
    <link rel="shortcut icon" href="/asset/icon/favicon.ico">
    <meta name="apple-mobile-web-app-title" content="jsonc-to-json">
    <meta name="application-name"           content="jsonc-to-json">
    <meta name="msapplication-config"       content="/asset/icon/browserconfig.xml">
    <meta name="theme-color"                content="#ffffff">
</head>
<body>
<header>
    <h1>jsonc-to-json v${version} — Node.js benchmarks</h1>
    <p>Generated ${timestamp} on Node ${nodeVersion}.</p>
    <p>Side-by-side comparison of the JavaScript and Rust/WASM implementations in
        Node.js, for trivial, small, large and huge inputs. Useful for checking
        performance differences between Node.js versions, and different
        jsonc-to-json releases.
    </p>
    <p><a href="./index.html">Back to the live demo</a></p>
    <p><a href="./bench.html">Run browser benchmarks</a></p>
</header>
<section>
    <h2>Summary</h2>
    <table>
        <thead>
        <tr>
            <th>Dataset</th>
            <th>Input size</th>
            <th>Iterations</th>
            <th>JS avg (ms)</th>
            <th>WASM avg (ms)</th>
            <th>Winner</th>
        </tr>
        </thead>
        <tbody>
${rows}
        </tbody>
    </table>
</section>
<section>
    <h2>Details</h2>
${detailBlocks}
</section>
</body>
</html>`;

  writeFileSync(outputPath, html);
  console.log(`\n📊 Benchmark report saved to docs/${outputName}`);
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${bytes} B`;
}

function formatMs(value) {
  if (!Number.isFinite(value)) return 'n/a';
  return value >= 10 ? value.toFixed(2) : value.toFixed(3);
}

function formatNumber(value) {
  return value.toLocaleString('en-US');
}

function formatMultiplier(value) {
  if (!Number.isFinite(value)) return '∞';
  return value.toFixed(2);
}
