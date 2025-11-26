// import api from "./client";

// export async function confirmVoiceItems(selections) {
//   const { data } = await api.post("/stock/confirm-voice", selections);
//   return data;
// }

import api from "./client";
const HARD_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0aGFpcy5wYWl2YUBnbWFpbC5jb20iLCJleHAiOjE3NjQxNzU1Mjl9.ouyIHP3z56nhgXGHTtPSSIbKcQr_U0l-8Gp4pYopmwc";

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

