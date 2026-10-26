export default [
    {
        files: ["scripts/**/*.js"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                // Browser
                console: "readonly",
                document: "readonly",
                window: "readonly",
                globalThis: "readonly",
                // Foundry VTT
                foundry: "readonly",
                game: "readonly",
                ui: "readonly",
                Hooks: "readonly",
                CONFIG: "readonly",
                CONST: "readonly",
                // Optional dependencies
                libWrapper: "readonly"
            }
        },
        rules: {
            "no-undef": "error",
            "no-unused-vars": ["error", { args: "none" }],
            "no-unreachable": "error",
            "no-dupe-keys": "error",
            "no-redeclare": "error",
            "eqeqeq": ["error", "smart"],
            "prefer-const": "error"
        }
    }
];
