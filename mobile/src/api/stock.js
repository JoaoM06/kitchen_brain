// import api from "./client";

// export async function confirmVoiceItems(selections) {
//   const { data } = await api.post("/stock/confirm-voice", selections);
//   return data;
// }

import api from "./client";
const HARD_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0aGFpcy5wYWl2YUBnbWFpbC5jb20iLCJleHAiOjE3NjI5MjgxMTl9.s8D6yfV5WqbobdQ7MOA1w539W4Bg51xJ3CjTJDd-bH0";

export async function confirmVoiceItems(selections) {
  const { data } = await api.post(
    "/stock/confirm-voice",
    selections,
    {
      headers: {
        Authorization: `Bearer ${HARD_TOKEN}`,
      }
    }
  );
  return data;
}

export async function fetchStock({ q } = {}) {
  const params = {};
  if (q) params.q = q;

  const { data } = await api.get("/stock/list", {
    params,
    headers: {
      Authorization: `Bearer ${HARD_TOKEN}`,
    },
  });

  return data;
}

