// Configuração dinâmica do Expo. Lê valores sensíveis de variáveis de ambiente
// (prefixo EXPO_PUBLIC_ é o único exposto ao bundle) em vez de hardcodá-los.
// O app.json continua sendo a base estática; aqui só sobrescrevemos `extra`.
//
// A chave do Gemini NÃO é mais usada pelo app: as chamadas de IA passam pelo
// backend (/cardapiobot/*), que mantém a chave em segredo. O campo abaixo fica
// disponível apenas para cenários futuros e nunca deve receber um valor real
// commitado.
export default ({ config }) => ({
  ...config,
  extra: {
    ...(config.extra || {}),
    API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || null,
    GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY || null,
  },
});
