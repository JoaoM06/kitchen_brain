// Configuração flat do ESLint para o app Expo (SDK 54 / ESLint 9).
const expoConfig = require("eslint-config-expo/flat");

module.exports = [
  ...expoConfig,
  {
    ignores: ["node_modules/", "dist/", ".expo/", "assets/"],
  },
  {
    // Globais do Jest nos arquivos de teste.
    files: ["**/__tests__/**/*.{js,jsx}", "**/*.test.{js,jsx}"],
    languageOptions: {
      globals: {
        jest: "readonly",
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
      },
    },
  },
];
