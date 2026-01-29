import api from "./client";

/**
 * Busca informações de um produto pelo código de barras.
 * @param {string} barcode - Código de barras (EAN-13 ou EAN-8)
 * @returns {Promise<{found: boolean, barcode: string, external_data?: object, local_product?: object, suggested_generico?: object}>}
 */
export async function lookupBarcode(barcode) {
    const response = await api.post("/barcode/lookup", null, {
        params: { barcode }
    });
    return response.data;
}

/**
 * Registra um novo produto com código de barras.
 * @param {object} data - Dados do produto
 * @param {string} data.barcode - Código de barras
 * @param {string} data.nome - Nome do produto
 * @param {string} [data.marca] - Marca
 * @param {string} [data.categoria] - Categoria
 * @param {string} [data.imagem_url] - URL da imagem
 * @param {string} [data.produto_generico_id] - ID do produto genérico para vincular
 * @returns {Promise<{success: boolean, produto_id: string, codigo_barras_id: string, produto_generico_id?: string}>}
 */
export async function registerBarcode(data) {
    const response = await api.post("/barcode/register", data);
    return response.data;
}

/**
 * Obtém informações de um código de barras já registrado.
 * @param {string} barcode - Código de barras
 * @returns {Promise<object>}
 */
export async function getBarcodeInfo(barcode) {
    const response = await api.get(`/barcode/${barcode}`);
    return response.data;
}

/**
 * Busca produtos genéricos por nome.
 * @param {string} query - Termo de busca
 * @param {number} [limit=10] - Limite de resultados
 * @returns {Promise<Array<{id: string, nome: string, categoria?: string, score: number}>>}
 */
export async function searchGenerico(query, limit = 10) {
    const response = await api.get("/barcode/search/generico", {
        params: { q: query, limit }
    });
    return response.data;
}
