import api from "./client";

export async function confirmVoiceItems(selections) {
  const { data } = await api.post("/stock/confirm-voice", selections);
  return data;
}

// const HARD_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0aGFpcy5wYWl2YUBnbWFpbC5jb20iLCJleHAiOjE3NjQxODEwODR9.OXKLKxQDB4gf3w8u5Flv008ziMRU9evZujp54L2Y9ZY";

// export async function confirmVoiceItems(selections) {
//   const { data } = await api.post(
//     "/stock/confirm-voice",
//     selections,
//     {
//       headers: {
//         Authorization: `Bearer ${HARD_TOKEN}`,
//       }
//     }
//   );
//   return data;
// }

export async function fetchStock({ q } = {}) {
  const params = {};
  if (q) params.q = q;

  const { data } = await api.get("/stock/list", {
    params
  });

  return data;
}

