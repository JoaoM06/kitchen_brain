import api from "./client";

/**
 * Lista receitas com filtros opcionais.
 * @param {object} params
 * @param {string} [params.q] - Busca por título
 * @param {string} [params.categoria] - Filtro por categoria
 * @param {number} [params.tempo_max] - Tempo máximo de preparo em minutos
 * @param {number} [params.limit=20] - Limite de resultados
 * @param {number} [params.offset=0] - Offset para paginação
 * @returns {Promise<Array>}
 */
export async function listRecipes(params = {}) {
    const response = await api.get("/recipes", { params });
    return response.data;
}

/**
 * Obtém receitas sugeridas baseadas no estoque do usuário.
 * @param {object} params
 * @param {number} [params.limit=10] - Limite de receitas
 * @param {boolean} [params.priorizar_vencendo=true] - Priorizar receitas com ingredientes vencendo
 * @param {string} token - Token de autenticação
 * @returns {Promise<Array>}
 */
export async function getSuggestedRecipes(params = {}, token) {
    const response = await api.get("/recipes/suggested", {
        params,
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
}

/**
 * Obtém detalhes de uma receita.
 * @param {string} recipeId - ID da receita
 * @param {string} token - Token de autenticação
 * @returns {Promise<object>}
 */
export async function getRecipe(recipeId, token) {
    const response = await api.get(`/recipes/${recipeId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
}

/**
 * Verifica disponibilidade dos ingredientes de uma receita no estoque.
 * @param {string} recipeId - ID da receita
 * @param {string} token - Token de autenticação
 * @returns {Promise<Array<{nome: string, disponivel: boolean, quantidade_estoque?: number, vencendo_em_dias?: number}>>}
 */
export async function checkRecipeAvailability(recipeId, token) {
    const response = await api.get(`/recipes/${recipeId}/availability`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
}

/**
 * Cria uma nova receita.
 * @param {object} data - Dados da receita
 * @param {string} data.titulo - Título da receita
 * @param {string} [data.descricao] - Descrição
 * @param {number} [data.tempo_preparo_min=0] - Tempo de preparo em minutos
 * @param {number} [data.rendimento_porcoes=1] - Rendimento em porções
 * @param {Array} data.ingredientes - Lista de ingredientes
 * @param {Array<string>} [data.modo_preparo] - Passos do modo de preparo
 * @param {string} token - Token de autenticação
 * @returns {Promise<object>}
 */
export async function createRecipe(data, token) {
    const response = await api.post("/recipes", data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
}

/**
 * Adiciona ou remove uma receita dos favoritos.
 * @param {string} recipeId - ID da receita
 * @param {string} token - Token de autenticação
 * @returns {Promise<{success: boolean, action: string, is_favorita: boolean}>}
 */
export async function toggleFavorite(recipeId, token) {
    const response = await api.post(`/recipes/${recipeId}/favorite`, null, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
}

/**
 * Obtém receitas favoritas do usuário.
 * @param {string} token - Token de autenticação
 * @returns {Promise<Array>}
 */
export async function getFavorites(token) {
    const response = await api.get("/recipes/playlists/favoritos", {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
}
