import { defineConfig } from "eslint/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import pluginVueA11y from "eslint-plugin-vuejs-accessibility";
import importPlugin from 'eslint-plugin-import';
import { rules } from 'eslint-config-airbnb-extended';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([
    ...pluginVueA11y.configs["flat/recommended"],
    rules.base.bestPractices,


    
    {
        plugins: {
            import: importPlugin
    },
    extends: compat.extends("plugin:vue/recommended"),

    languageOptions: {
        globals: {
            $: "readonly",
            alert: "readonly",
            document: "readonly",
            window: "readonly",
            defineModel: "readonly",
            __WEB_FORMS_VERSION__: "readonly",
        },

        ecmaVersion: "latest",
        sourceType: "module",
    },

    rules: {
        "no-loop-func": "error",
        "vuejs-accessibility/no-static-element-interactions": "off",
        "import/prefer-default-export": "error",
        "no-param-reassign": "error",
        "arrow-parens": "off",
        "class-methods-use-this": "off",
        "comma-dangle": ["error", "only-multiline"],
        curly: "off",
        "implicit-arrow-linebreak": "off",
        "import/first": "off",

        // "import/no-extraneous-dependencies": ["error", {
        //     devDependencies: ["**/test/**", "vite.config.js"],
        // }],

        "lines-between-class-members": ["error", "always", {
            exceptAfterSingleLine: true,
        }],

        "max-classes-per-file": "off",
        "max-len": "off",
        "vue/max-len": "off",
        "newline-per-chained-call": "off",
        "no-console": "error",
        "no-debugger": "error",

        "no-empty": ["error", {
            allowEmptyCatch: true,
        }],

        "no-multiple-empty-lines": ["error", {
            max: 3,
        }],

        "no-nested-ternary": "off",
        "no-restricted-syntax": ["error", "LabeledStatement", "WithStatement"],
        "no-underscore-dangle": "off",
        "nonblock-statement-body-position": "off",

        "object-curly-newline": ["error", {
            multiline: true,
            minProperties: 0,
            consistent: true,
        }],

        "object-property-newline": "off",

        "operator-linebreak": ["error", "after", {
            overrides: {
                "?": "before",
                ":": "before",
            },
        }],

        "prefer-object-has-own": "error",

        "space-before-function-paren": ["error", {
            anonymous: "never",
            named: "never",
            asyncArrow: "always",
        }],

        "spaced-comment": "off",

        "vue/attributes-order": ["error", {
            order: [
                "LIST_RENDERING",
                ["CONDITIONALS", "DEFINITION"],
                "RENDER_MODIFIERS",
                "GLOBAL",
                ["UNIQUE", "SLOT"],
                "TWO_WAY_BINDING",
                ["OTHER_DIRECTIVES", "OTHER_ATTR"],
                "EVENTS",
                "CONTENT",
            ],

            alphabetical: false,
        }],

        "vue/first-attribute-linebreak": "off",

        "vue/html-closing-bracket-newline": ["error", {
            singleline: "never",
            multiline: "never",
        }],

        "vue/html-closing-bracket-spacing": ["error", {
            startTag: "never",
            endTag: "never",
            selfClosingTag: "never",
        }],

        "vue/html-indent": "off",

        "vue/html-self-closing": ["error", {
            html: {
                void: "never",
                normal: "never",
                component: "always",
            },

            svg: "always",
            math: "always",
        }],

        "vue/max-attributes-per-line": "off",
        "vue/multi-word-component-names": "off",
        "vue/no-setup-props-destructure": "off",
        "vue/no-template-target-blank": "off",
        "vue/object-curly-newline": "off",
        "vue/require-default-prop": "off",
        "vue/singleline-html-element-content-newline": "off",

        "vuejs-accessibility/label-has-for": ["error", {
            controlComponents: ["flatpickr"],

            required: {
                some: ["nesting", "id"],
            },
        }],
        "no-loop-func": "error",
    },
    
},
    {
        files: ["**/test/**/*.js"],
        rules: {
         "no-unused-expressions": "off",
         "no-loop-func": "error",
        }
    },

    {
        files: ["**/bin/**/*.js"],
        rules: {
         "no-console": "off"
        }
    },

]);