// Configuração dinâmica do Expo. Lê valores sensíveis de variáveis de ambiente
// (prefixo EXPO_PUBLIC_ é o único exposto ao bundle) em vez de hardcodá-los.
// O app.json continua sendo a base estática; aqui só sobrescrevemos `extra`.
//
// A chave do Gemini NÃO é usada pelo app: as chamadas de IA passam pelo backend
// (/cardapiobot/*), que mantém a chave em segredo. Por isso ela não aparece aqui.
export default ({ config }) => ({
  ...config,
  extra: {
    ...(config.extra || {}),
    API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || null,
  },
});
