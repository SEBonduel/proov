import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Bruyant pour du texte francais (apostrophes) : on n'echappe pas en JSX.
      "react/no-unescaped-entities": "off",
      // Motifs volontaires (chargement initial, polling, reset a l'ouverture) : conseil, pas erreur.
      "react-hooks/set-state-in-effect": "warn",
      // Autorise les parametres prefixes par _ (ex. _prev, _formData des Server Actions).
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
