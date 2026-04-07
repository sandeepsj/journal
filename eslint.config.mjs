import storybook from "eslint-plugin-storybook";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  globalIgnores([
    "dist/**",
    "build/**",
  ]),
  ...storybook.configs["flat/recommended"]
]);

export default eslintConfig;
