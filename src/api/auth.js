import api from "./client";

export async function register({ nome, email, senha }) {
    const { data } = await api.post("/auth/register", { email, senha, nome });
    return data;
}

export async function login({ email, senha }) {
    const { data } = await api.post("/auth/login", { email, senha });
    return data;
}