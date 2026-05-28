import api from "./client";

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
 * @param {string} token - Token de autenticação
 * @returns {Promise<object>} Cardápio gerado
 */
export async function generateCardapio(params, token) {
    const response = await api.post("/cardapiobot/generate", params, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 60000, // 60s para IA processar
    });
    return response.data;
}

/**
 * Envia mensagem para o chat do CardapioBot.
 * @param {Array<{role: string, content: string}>} messages - Histórico de mensagens
 * @param {object} [context] - Contexto adicional
 * @param {string} token - Token de autenticação
 * @returns {Promise<{response: string, role: string}>}
 */
export async function chatCardapiobot(messages, context, token) {
    const response = await api.post("/cardapiobot/chat",
        { messages, context },
        {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 30000,
        }
    );
    return response.data;
}

/**
 * Salva um cardápio gerado no histórico do usuário.
 * @param {object} cardapio - Cardápio para salvar
 * @param {string} token - Token de autenticação
 * @returns {Promise<{success: boolean, cardapio_id: string, message: string}>}
 */
export async function saveCardapio(cardapio, token) {
    const response = await api.post("/cardapiobot/save", cardapio, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
}

/**
 * Obtém histórico de cardápios do usuário.
 * @param {number} [limit=10] - Limite de resultados
 * @param {string} token - Token de autenticação
 * @returns {Promise<Array>}
 */
export async function getCardapioHistory(limit, token) {
    const response = await api.get("/cardapiobot/history", {
        params: { limit },
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
}

/**
 * Obtém detalhes de um cardápio salvo.
 * @param {string} cardapioId - ID do cardápio
 * @param {string} token - Token de autenticação
 * @returns {Promise<object>}
 */
export async function getCardapioDetail(cardapioId, token) {
    const response = await api.get(`/cardapiobot/history/${cardapioId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
}
