import api from "./client";

// O token de autenticação é injetado automaticamente pelo interceptor do
// client.js (ver mobile/src/api/client.js); por isso nenhuma função abaixo
// recebe ou seta o header Authorization manualmente.

/**
 * Gera um cardápio personalizado usando IA.
 * @param {object} params - Parâmetros para geração
 * @param {number} [params.dias=7] - Número de dias
 * @param {number} [params.orcamento] - Orçamento em R$
 * @param {number} [params.tempo_max_preparo] - Tempo máximo de preparo em minutos
 * @param {number} [params.porcoes=2] - Porções por refeição
 * @param {string} [params.estilo_alimentar] - vegetariano, vegano, low-carb, etc
 * @param {string[]} [params.culinarias] - Culinárias preferidas
 * @param {string[]} [params.equipamentos] - Equipamentos disponíveis
 * @param {string} [params.mensagem_adicional] - Observações extras
 * @returns {Promise<object>} Cardápio gerado
 */
export async function generateCardapio(params) {
    const response = await api.post("/cardapiobot/generate", params, {
        timeout: 60000, // 60s para IA processar
    });
    return response.data;
}

/**
 * Envia mensagem para o chat do CardapioBot.
 * @param {Array<{role: string, content: string}>} messages - Histórico de mensagens
 * @param {object} [context] - Contexto adicional
 * @returns {Promise<{response: string, role: string}>}
 */
export async function chatCardapiobot(messages, context) {
    const response = await api.post(
        "/cardapiobot/chat",
        { messages, context },
        { timeout: 30000 }
    );
    return response.data;
}

/**
 * Salva um cardápio gerado no histórico do usuário.
 * @param {object} cardapio - Cardápio para salvar
 * @returns {Promise<{success: boolean, cardapio_id: string, message: string}>}
 */
export async function saveCardapio(cardapio) {
    const response = await api.post("/cardapiobot/save", cardapio);
    return response.data;
}

/**
 * Obtém histórico de cardápios do usuário.
 * @param {number} [limit=10] - Limite de resultados
 * @returns {Promise<Array>}
 */
export async function getCardapioHistory(limit) {
    const response = await api.get("/cardapiobot/history", {
        params: { limit },
    });
    return response.data;
}

/**
 * Obtém detalhes de um cardápio salvo.
 * @param {string} cardapioId - ID do cardápio
 * @returns {Promise<object>}
 */
export async function getCardapioDetail(cardapioId) {
    const response = await api.get(`/cardapiobot/history/${cardapioId}`);
    return response.data;
}
