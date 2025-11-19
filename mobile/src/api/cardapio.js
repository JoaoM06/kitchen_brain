
export async function salvarCardapio( cardapio ) {
    await api.post("/profile/cardapio", {
        cardapio:JSON.stringify(cardapio)
    });
}