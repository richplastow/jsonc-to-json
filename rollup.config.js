import terser from '@rollup/plugin-terser';
import packageJson from './package.json' with { type: 'json' };

const banner = (heading) => {
    const { bugs, description, homepage, license, version } = packageJson;
    const gitHub = bugs.url.slice(0, -7); // remove '/issues' suffix
    return [
        '/**',
        ' * @fileoverview',
        ` * ${heading}`,
        ' * ',
        ` * ${description}`,
        ' * ',
        ` * - Version: ${version}`,
        ` * - License: ${license}`,
        ` * - GitHub: <${gitHub}>`,
        ` * - Live demo: <${homepage}>`,
        ' */',
        '',
    ].join('\n');
}

// A custom Rollup plugin that checks that the built file has this line:
//     const BUILD_VARIANT = 'js-and-wasm';
// ...and that the variant matches the file name.
const checkBuildVariant = () => {
    return {
        name: 'check-build-variant',
        generateBundle(_, bundle) {
            for (const fileName of Object.keys(bundle)) {
                const chunk = bundle[fileName];
                const match = chunk.code.match(
                    /const BUILD_VARIANT = '([\w-]+)';/);
                if (!match) {
                    this.error(`BUILD_VARIANT line not found in ${fileName}`);
                }
                const variantInCode = match[1];
                const expectedVariant = fileName.includes('js-and-wasm')
                    ? 'js-and-wasm'
                    : fileName.includes('js-only')
                        ? 'js-only'
                        : fileName.includes('wasm-only')
                            ? 'wasm-only'
                            : null;
                if (variantInCode !== expectedVariant) {
                    this.error(
                        `BUILD_VARIANT mismatch in ${fileName}: ` +
                        `found '${variantInCode}', expected '${expectedVariant}'`);
                }
            }
        },
    };
};

// A custom Rollup plugin that checks that the built file has this line:
//     const PACKAGE_VERSION = '12.34.567';
// ...and that the version matches package.json's "version".
const checkPackageVersion = () => {
    return {
        name: 'check-package-version',
        generateBundle(_, bundle) {
            for (const fileName of Object.keys(bundle)) {
                const chunk = bundle[fileName];
                const match = chunk.code.match(
                    /const PACKAGE_VERSION = '([\d.]+)';/);
                if (!match) {
                    this.error(`PACKAGE_VERSION line not found in ${fileName}`);
                }
                const versionInCode = match[1];
                if (versionInCode !== packageJson.version) {
                    this.error(
                        `PACKAGE_VERSION mismatch in ${fileName}: ` +
                        `found '${versionInCode}', expected '${packageJson.version}'`);
                }
            }
        },
    };
};

// A custom Rollup plugin that appends '.min' to the BUILD_VARIANT constant.
// We assume that checkBuildVariant() has been run on the unminified build, so
// we know the BUILD_VARIANT value is correct.
// **IMPORTANT:** terser() will mangle the neat `const BUILD_VARIANT = ` code,
// so this plugin must be run before terser() in the `plugins` array.
const appendMinToBuildVariant = () => {
    return {
        name: 'append-min-to-build-variant',
        renderChunk(code) {
            return code.replace(
                /const BUILD_VARIANT = '([\w-]+)';/,
                (_match, p1) => `const BUILD_VARIANT = '${p1}.min';`);
        },
    };
};

const configTemplate = {
    input: 'FILL ME',
    output: {
        banner: 'FILL ME',
        file: 'FILL ME',
        format: 'esm',
        sourcemap: false,
    },
    external: [],
    plugins: [],
};

const jsAndWasmTemplate = {
    ...configTemplate,
    input: 'src/jsonc-to-json--js-and-wasm.js',
    output: {
        ...configTemplate.output,
        banner: banner`Combined JS and WASM build of jsonc-to-json.`,
        file: 'dist/jsonc-to-json--js-and-wasm.js',
    },
};

const jsOnlyTemplate = {
    ...configTemplate,
    input: 'src/jsonc-to-json--js-only.js',
    output: {
        ...configTemplate.output,
        banner: banner`JavaScript-only build of jsonc-to-json.`,
        file: 'dist/jsonc-to-json--js-only.js',
    },
};

const wasmOnlyTemplate = {
    ...configTemplate,
    input: 'src/jsonc-to-json--wasm-only.js',
    output: {
        ...configTemplate.output,
        banner: banner`WASM-only build of jsonc-to-json.`,
        file: 'dist/jsonc-to-json--wasm-only.js',
    },
};

// Export six builds - three variants (js-and-wasm, js-only, wasm-only),
// unminified and minified.
const config = [

    // JS-and-WASM builds (can switch implementation at runtime).
    {
        ...jsAndWasmTemplate, // unminified
        plugins: [checkBuildVariant(), checkPackageVersion()],
    },
    {
        ...jsAndWasmTemplate,
        output: {
            ...jsAndWasmTemplate.output,
            file: 'dist/jsonc-to-json--js-and-wasm.min.js',
        },
        plugins: [appendMinToBuildVariant(), terser()], // minified
    },

    // JS-only builds (no WASM, always uses JavaScript pipeline).
    {
        ...jsOnlyTemplate, // unminified
        plugins: [checkBuildVariant(), checkPackageVersion()],
    },
    {
        ...jsOnlyTemplate,
        output: {
            ...jsOnlyTemplate.output,
            file: 'dist/jsonc-to-json--js-only.min.js',
        },
        plugins: [appendMinToBuildVariant(), terser()], // minified
    },

    // WASM-only builds (requires WASM, throws if unavailable).
    {
        ...wasmOnlyTemplate, // unminified
        plugins: [checkBuildVariant(), checkPackageVersion()],
    },
    {
        ...wasmOnlyTemplate,
        output: {
            ...wasmOnlyTemplate.output,
            file: 'dist/jsonc-to-json--wasm-only.min.js',
        },
        plugins: [appendMinToBuildVariant(), terser()], // minified
    },

];

export default config;
