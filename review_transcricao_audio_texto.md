# Review resumido — Transcrição de áudio → texto

## Visão geral
- **Backend (`transcribe.py`, FastAPI + faster-whisper)**: recebe `UploadFile`, grava em tmp, transcreve com `WhisperModel(small, int8)` e retorna `{"text": …}`.
- **Mobile (`VoiceRecScreen.jsx`, Expo-AV)**: UI com botão único Gravar/Parar, logo “pulsante”, `TextInput` para exibir/editar a transcrição e chamada a `transcribeAudio({ uri, language: "pt" })`.

---

## Pontos fortes
- **Backend**
  - Fluxo simples e correto de arquivo temporário + limpeza no `finally`.
  - Uso de **VAD** e **beam search** (qualidade mais robusta).
  - Tratamento de erro com `HTTPException`.

- **Mobile**
  - UX direta (um botão alterna estados) e **loading** enquanto transcreve.
  - Configuração de áudio adequada (iOS em modo silencioso).
  - Estados de UI separados (`isRecording`, `loading`, `recognizedText`).

---

## Riscos e melhorias prioritárias
- **Carregamento do modelo no import**: aumenta tempo/memória de boot por worker. Preferir **lazy load** (carregar no 1º uso).
- **Content-Type rígido**: alguns uploads chegam como `application/octet-stream`. Aceitar esse caso para não rejeitar áudio válido.
- **Limites**: sem **limite de tamanho/duração**; risco de requisições caras. Definir limite (ex.: 50 MB/10 min) e retornar 413.
- **Metadados úteis**: hoje só retorna `text`. Considere expor `language` detectado e `duration_s` para telemetria/UX.
- **Concorrência/escala**: transcrição é pesada; avaliar fila/worker se houver picos.
- **Mobile – timers**: `setInterval` da animação deve ser **limpo no unmount** e em erros; adicionar **timer mm:ss** e **auto-stop** (ex.: 10 min).
- **Animação**: é estética (não reflete volume real). Deixar explícito ou remover expectativa de “VU meter”.
- **Acessibilidade/UX de erro**: labels/hints, mensagens de erro do backend e opção de tentar novamente.

---

## Recomendações rápidas
1. **Backend**
   - Lazy load do Whisper (com `device="auto"`), aceitar `octet-stream`, impor limite de bytes e retornar `{ text, language, duration_s }`.
2. **Mobile**
   - Garantir que `transcribeAudio` envie `FormData` com `{ uri, name: "audio.m4a", type: "audio/m4a" }` sem setar `Content-Type` manualmente.
   - Limpar todos os **timers** (gravação/animação) em `stop` e `useEffect` de unmount.
   - Adicionar **cronômetro** e **limite de duração**; exibir “Transcrevendo…” enquanto aguarda.
   - Melhorar acessibilidade (labels/hints) e feedback de erro.

---

## Checklist de QA
- [ ] Upload de `m4a/mp3/wav/ogg` funciona em Android/iOS.  
- [ ] Backend aceita `application/octet-stream`.  
- [ ] Limites aplicados: 413 para arquivo grande; app faz auto-stop.  
- [ ] Estados visíveis: “gravando…”, “transcrevendo…”, erros amigáveis.  
- [ ] Timers e gravação sempre limpos em sucesso/erro/unmount.
