import api from "./client";
import { setAuthToken } from "./client";

export async function register({ nome, email, senha }) {
  const { data } = await api.post("/auth/register", { email, senha, nome });
  return data;
}

export async function login({ email, senha }) {
  const { data } = await api.post("/auth/login", { email, senha });

  if (data?.access_token) {
    await setAuthToken(data.access_token);
  } else {
    throw new Error("JWT não encontrado na resposta do servidor");
  }

  return data;
}

export async function getMe() {
  const { data } = await api.get("/auth/me");
  return data;
}
