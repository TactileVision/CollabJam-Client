import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import eslintConfigPrettier from "eslint-config-prettier";
import vueEslintParser from "vue-eslint-parser"
import eslintPluginVueScopedCSS from 'eslint-plugin-vue-scoped-css';

export default [
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueEslintParser,
      parserOptions: {
        parser: '@typescript-eslint/parser',
        // project: ['./tsconfig.json'],
      },
    }
  },


  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs["flat/strongly-recommended"],
  ...eslintPluginVueScopedCSS.configs['flat/recommended'],
  eslintConfigPrettier,
];