// Configuração flat do ESLint para o app Expo (SDK 54 / ESLint 9).
const expoConfig = require("eslint-config-expo/flat");

module.exports = [
  ...expoConfig,
  {
    ignores: ["node_modules/", "dist/", ".expo/", "assets/"],
  },
];
