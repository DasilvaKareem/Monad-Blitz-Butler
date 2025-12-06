import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Disable strict any checking for the realtime agents code
      "@typescript-eslint/no-explicit-any": "off",
      // Disable exhaustive deps warning for complex hooks
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];

export default eslintConfig;
