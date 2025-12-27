const configTemplate = {
    input: 'src/jsonc-to-json.js',
    output: {
        file: 'FILL ME',
        format: 'esm',
        sourcemap: false,
    },
    external: [],
    plugins: []
};

// Export two identical builds - one for npm, and one for GitHub Pages.
const config = [
    {
        ...configTemplate,
        output: {
            ...configTemplate.output,
            file: 'dist/jsonc-to-json.js', // dist/ for npm
        }
    },
    {
        ...configTemplate,
        output: {
            ...configTemplate.output,
            file: 'docs/jsonc-to-json.js', // docs/ for GitHub Pages
        }
    },
];

export default config;
