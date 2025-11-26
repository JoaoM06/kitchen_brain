import api from "./client";

export async function transcribeAudio({ uri, language = "pt", filename, mime }) {
  const name = filename || (uri.split("/").pop() || "speech.m4a");
  const ext = (name.split(".").pop() || "").toLowerCase();
  const guessMime =
    mime ||
    (ext === "m4a" ? "audio/m4a" :
     ext === "mp3" ? "audio/mpeg" :
     ext === "wav" ? "audio/wav" :
     "application/octet-stream");

  const form = new FormData();
  form.append("audio", {
    uri,
    name,
    type: guessMime,
  });

  const res = await api.post("/voice/transcribe", form, {
    params: { language },
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}