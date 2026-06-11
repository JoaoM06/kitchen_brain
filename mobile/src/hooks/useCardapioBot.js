// Estado e pipeline do chat do CardapioBot: mensagens, envio (com retry/backoff),
// parsing do <MENU>, fallback de demonstração e geração/compartilhamento de PDF.
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Keyboard, Platform } from "react-native";
import * as Sharing from "expo-sharing";

import { chatCardapiobot } from "../api/cardapiobot";
import { MOCK_MENU_RESPONSE, STARTER_BOT_MSG } from "../utils/cardapioConstants";
import { buildPrompt } from "../utils/cardapioPrompt";
import { applyUserOverrides, parseMenuChip, shouldUseDemoCardapio } from "../utils/menuParser";
import { generateMenuPdf } from "../utils/menuPdf";

export function useCardapioBot() {
  const [messages, setMessages] = useState([STARTER_BOT_MSG]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [lastMenuChip, setLastMenuChip] = useState(null);

  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const sub = Keyboard.addListener("keyboardDidShow", () => setShowEmoji(false));
    return () => sub.remove();
  }, []);

  const canSend = text.trim().length > 0 && !loading;

  const scrollToEnd = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  }, []);

  const callGemini = useCallback(async (prompt, retries = 3) => {
    setLoading(true);

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // A chave do Gemini vive apenas no backend; o app só envia o prompt
        // como mensagem de usuário para /cardapiobot/chat. O token de
        // autenticação é injetado automaticamente pelo client.js.
        const data = await chatCardapiobot([{ role: "user", content: prompt }], null);
        setLoading(false);

        const txt = String(data?.response || "").trim();
        if (!txt) throw new Error("Resposta vazia do servidor");
        return txt;
      } catch (error) {
        const status = error?.response?.status;

        if ((status === 503 || status === 429) && attempt < retries) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt), 8000);
          console.log(`⏳ IA indisponível. Tentando novamente em ${waitTime / 1000}s... (${attempt + 1}/${retries})`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }

        if (attempt === retries) {
          setLoading(false);
          throw error;
        }

        const waitTime = Math.min(1000 * Math.pow(2, attempt), 8000);
        console.log(`⚠️ Erro de conexão. Tentando novamente em ${waitTime / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }, []);

  const finishWithParsedMenu = useCallback(
    async (parsed, { defaultText, userText, isFallback } = {}) => {
      const baseId = Date.now();
      const talkText =
        parsed?.cleanText?.trim() ||
        defaultText ||
        (parsed?.menuChip ? "Cardápio pronto! Veja o resumo abaixo." : "Tudo certo!");
      const baseMsg = { id: String(baseId), role: "bot", text: talkText };

      let menuChipToUse = parsed?.menuChip;
      let manualNotes = [];
      if (userText && menuChipToUse) {
        const adjusted = applyUserOverrides(menuChipToUse, userText, { force: isFallback });
        menuChipToUse = adjusted.menuChip;
        manualNotes = adjusted.notes;
      }

      if (menuChipToUse) {
        const menuId = menuChipToUse.id || `menu-${baseId}`;
        const enrichedChip = {
          ...menuChipToUse,
          id: menuId,
          generatedAt: new Date().toISOString(),
        };
        setLastMenuChip(enrichedChip);

        const menuMsg = { id: String(baseId + 1), role: "bot", menuChip: enrichedChip };
        const extraMsgs = [];
        let msgIdCursor = baseId + 2;

        if (manualNotes.length) {
          extraMsgs.push({
            id: String(msgIdCursor++),
            role: "bot",
            text: `Ajustes aplicados: ${manualNotes.join("; ")}`,
          });
        }

        extraMsgs.push({
          id: String(msgIdCursor++),
          role: "bot",
          text: "Cardápio gerado com sucesso! 🎉",
          showPdfButton: true,
          menuChipForPdf: enrichedChip,
        });

        setMessages((prev) => prev.filter((m) => m.id !== "typing").concat(baseMsg, menuMsg, ...extraMsgs));
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== "typing").concat(baseMsg));
      }

      scrollToEnd();
    },
    [scrollToEnd]
  );

  const handleSend = useCallback(
    async (promptContext) => {
      const content = text.trim();
      if (!content) return;

      const baseId = Date.now();
      const userMsg = { id: String(baseId), role: "user", text: content };
      const prompt = buildPrompt(content, promptContext);

      setMessages((prev) => [...prev, userMsg, { id: "typing", role: "bot", isTyping: true }]);
      setText("");
      setShowEmoji(false);
      scrollToEnd();

      try {
        const reply = await callGemini(prompt);
        await finishWithParsedMenu(parseMenuChip(reply), { userText: content });
      } catch (e) {
        console.warn("CardapioBot", e);
        if (shouldUseDemoCardapio(e)) {
          await finishWithParsedMenu(parseMenuChip(MOCK_MENU_RESPONSE), {
            defaultText:
              "Não consegui falar com o Gemini agora, então gerei um cardápio de demonstração para você continuar testando.",
            userText: content,
            isFallback: true,
          });
        } else {
          const status = e?.response?.status;
          let errorMessage = "Ops! Não consegui gerar o cardápio agora.";

          if (status === 503) {
            errorMessage = "😔 O serviço de IA está indisponível no momento. Por favor, aguarde alguns minutos e tente novamente.";
          } else if (status === 429) {
            errorMessage = "⏱️ Você atingiu o limite de requisições. Aguarde um momento antes de tentar novamente.";
          } else if (status === 401 || status === 403) {
            errorMessage = "🔑 Sua sessão expirou. Faça login novamente para continuar.";
          } else if (e.message?.includes("network") || e.message?.includes("fetch") || e.message?.includes("Network")) {
            errorMessage = "📡 Erro de conexão com a internet. Verifique sua rede e tente novamente.";
          }

          const botErr = { id: String(Date.now() + 1), role: "bot", error: true, text: errorMessage };
          setMessages((prev) => prev.filter((m) => m.id !== "typing").concat(botErr));
        }
      } finally {
        setLoading(false);
      }
    },
    [text, callGemini, finishWithParsedMenu, scrollToEnd]
  );

  const sharePdf = useCallback(async (uri, name = "Cardápio em PDF") => {
    if (!uri) {
      Alert.alert("PDF", "Não há arquivo disponível ainda. Gere um novo cardápio.");
      return;
    }

    try {
      const finalName = name?.toLowerCase?.().endsWith(".pdf") ? name : `${name || "cardapio"}.pdf`;

      if (Platform.OS === "web") {
        const hasDocument = typeof document !== "undefined";
        if (hasDocument) {
          const downloadLink = document.createElement("a");
          const response = await fetch(uri);
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          downloadLink.href = url;
          downloadLink.download = finalName;
          downloadLink.style.display = "none";
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          URL.revokeObjectURL(url);
        } else if (typeof window !== "undefined") {
          window.open(uri, "_blank");
        } else {
          Alert.alert("PDF gerado", `${finalName}\n${uri}`);
        }
        return;
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: finalName });
      } else {
        Alert.alert("PDF gerado", `${finalName}\n${uri}`);
      }
    } catch {
      Alert.alert("Erro", "Não foi possível abrir/compartilhar o PDF.");
    }
  }, []);

  const handleGeneratePdf = useCallback(
    async (menuChip, messageId) => {
      if (!menuChip) return;

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, generatingPdf: true, error: false } : m))
      );

      try {
        const pdfFile = await generateMenuPdf(menuChip);

        if (Platform.OS === "web") {
          Alert.alert("PDF", "Cardápio preparado! Verifique seus downloads.");
        } else if (pdfFile?.uri) {
          await sharePdf(pdfFile.uri, pdfFile.name);
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, generatingPdf: false, showPdfButton: false, text: "PDF gerado! Confira seus downloads." }
              : m
          )
        );
      } catch (err) {
        console.warn("Erro ao gerar PDF:", err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, generatingPdf: false, error: true, text: "Erro ao gerar o PDF. Tente novamente." }
              : m
          )
        );
      }
    },
    [sharePdf]
  );

  return {
    messages,
    text,
    setText,
    loading,
    showEmoji,
    setShowEmoji,
    lastMenuChip,
    listRef,
    inputRef,
    canSend,
    handleSend,
    handleGeneratePdf,
    scrollToEnd,
  };
}
