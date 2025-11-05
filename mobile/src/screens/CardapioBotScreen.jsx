import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements"; // altura real do header
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";

const GEMINI_MODEL = "gemini-2.5-flash";
const API_KEY = Constants.expoConfig?.extra?.GEMINI_API_KEY;

const EMOJIS = ["😀","😁","😂","😊","😍","😋","😎","🤔","🙌","👍","👎","🥗","🍲","🍛","🍳","🥪","🍎","🥦","🧀","🥖","🍗"];

const STARTER_BOT_MSG = {
  id: "m0",
  role: "bot",
  text:
    "Bom dia! Sou seu assistente de geração de cardápios! Inicie uma conversa comigo para que eu possa te auxiliar a montar o melhor cardápio possível para você!",
};

export default function CardapioBotScreen() {
  const [messages, setMessages] = useState([STARTER_BOT_MSG]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

  const listRef = useRef(null);
  const inputRef = useRef(null);
  const headerHeight = useHeaderHeight(); // usado como offset do teclado

  useEffect(() => {
    const sub = Keyboard.addListener("keyboardDidShow", () => setShowEmoji(false));
    return () => sub.remove();
  }, []);

  const canSend = text.trim().length > 0 && !loading;

  const handleSend = async () => {
    const content = text.trim();
    if (!content) return;

    const userMsg = { id: String(Date.now()), role: "user", text: content };
    setMessages(prev => [...prev, userMsg, { id: "typing", role: "bot", isTyping: true }]);
    setText("");
    setShowEmoji(false);
    scrollToEnd();

    try {
      const reply = await callGemini(buildPrompt(content));
      const parsed = parseMenuChip(reply);
      const botMsg = {
        id: String(Date.now() + 1),
        role: "bot",
        text: parsed.cleanText,
        menuChip: parsed.menuChip || undefined,
      };
      setMessages(prev => prev.filter(m => m.id !== "typing").concat(botMsg));
      scrollToEnd();
    } catch (e) {
      const botErr = {
        id: String(Date.now() + 1),
        role: "bot",
        error: true,
        text:
          "Ops! Não consegui falar com o Gemini agora. Verifique sua conexão e sua chave (GEMINI_API_KEY) e tente novamente.",
      };
      setMessages(prev => prev.filter(m => m.id !== "typing").concat(botErr));
    } finally {
      setLoading(false);
    }
  };

  function scrollToEnd() {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  }

  function buildPrompt(userText) {
    return `
Você é o CardapioBot, um assistente de cozinha em pt-BR.

Tarefas:
1) Responder de forma útil e curta, em português.
2) Se o usuário pedir um cardápio semanal, gere um plano de 7 dias com café da manhã, almoço, jantar e lanches, usando itens informados pelo usuário quando possível.
3) Nunca use ingredientes proibidos (alergias se informadas).
4) Quando efetivamente gerar um cardápio, além do texto, retorne um bloco JSON entre:
<MENU>{...}</MENU>
com:
{
  "type": "menu_chip",
  "title": "CARDÁPIO SEMANAL X",
  "dateRange": "DD/MM - DD/MM",
  "menu": { "dias": [ { "dia": "Domingo", "refeicoes": [ { "nome": "Café", "itens": [] }, ... ] }, ... ] }
}

Conversa:
"${userText}"
`;
  }

  async function callGemini(prompt) {
    if (!API_KEY) throw new Error("Falta GEMINI_API_KEY em app.json -> extra");
    setLoading(true);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`;
    const body = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, topP: 0.95, topK: 40, maxOutputTokens: 1024 },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Gemini HTTP ${res.status}: ${txt}`);
    }
    const data = await res.json();
    const txt =
      data?.candidates?.[0]?.content?.parts?.map(p => p?.text).filter(Boolean).join("\n")?.trim() || "";
    return txt;
  }

  function parseMenuChip(raw) {
    if (!raw) return { cleanText: "" };
    const rx = /<MENU>([\s\S]*?)<\/MENU>/im;
    const match = raw.match(rx);
    if (!match) return { cleanText: raw.trim() };

    const before = raw.slice(0, match.index).trim();
    const after = raw.slice((match.index || 0) + match[0].length).trim();
    const cleanText = [before, after].filter(Boolean).join("\n\n").trim();

    try {
      const json = JSON.parse(match[1]);
      if (json?.type === "menu_chip") {
        return {
          cleanText: cleanText || "Claro! aqui está o seu cardápio!",
          menuChip: {
            title: String(json.title ?? "CARDÁPIO SEMANAL"),
            dateRange: json.dateRange ? String(json.dateRange) : undefined,
            payload: json.menu ?? json,
          },
        };
      }
    } catch {}
    return { cleanText: raw.trim() };
  }

  const renderItem = ({ item }) => {
    if (item.isTyping) {
      return (
        <View style={[styles.row, styles.left]}>
          <View style={[styles.bubble, styles.botBubble]}>
            <TypingDots />
          </View>
        </View>
      );
    }
    return (
      <View style={[styles.row, item.role === "user" ? styles.right : styles.left]}>
        <View
          style={[
            styles.bubble,
            item.role === "user" ? styles.userBubble : styles.botBubble,
            item.error && { borderColor: "#c00", borderWidth: 1 },
          ]}
        >
          {item.role === "bot" && <Text style={styles.botName}>CardapioBot</Text>}
          {!!item.text && <Text style={styles.msgText}>{item.text}</Text>}
        </View>
      </View>
    );
  };

  return (
    // View simples: sem padding extra de top/bottom – o header do navigator já cuida do topo.
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? headerHeight : 0} // offset exato do header iOS
      >
        <FlatList
          ref={listRef}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 12 + (showEmoji ? 220 : 0), // só o que precisamos
          }}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToEnd}
        />

        {showEmoji && (
          <View style={styles.emojiPanel}>
            <Text style={styles.emojiTitle}>Emojis</Text>
            <View style={styles.emojiGrid}>
              {EMOJIS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={styles.emojiBtn}
                  onPress={() => {
                    setText((prev) => prev + e);
                    inputRef.current?.focus?.();
                  }}
                >
                  <Text style={styles.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.inputBar}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {
              setShowEmoji((v) => {
                const next = !v;
                if (next) Keyboard.dismiss();
                else inputRef.current?.focus?.();
                return next;
              });
            }}
          >
            <Text style={{ fontSize: 20 }}>😊</Text>
          </TouchableOpacity>

          <TextInput
            ref={inputRef}
            style={styles.textInput}
            value={text}
            onChangeText={setText}
            placeholder="Digite aqui…"
            placeholderTextColor="#999"
            editable={!loading}
            onFocus={() => setShowEmoji(false)}
            onSubmitEditing={canSend ? handleSend : undefined}
            returnKeyType="send"
          />

          {loading ? (
            <View style={[styles.goBtn, styles.goDisabled]}>
              <ActivityIndicator />
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.goBtn, !canSend && styles.goDisabled]}
              disabled={!canSend}
              onPress={handleSend}
            >
              <Text style={styles.goText}>Go</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function TypingDots() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", height: 18 }}>
      <View style={styles.dot} />
      <View style={[styles.dot, { opacity: 0.6 }]} />
      <View style={[styles.dot, { opacity: 0.3 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  row: { width: "100%", marginBottom: 12, flexDirection: "row" },
  left: { justifyContent: "flex-start" },
  right: { justifyContent: "flex-end" },

  bubble: {
    maxWidth: "85%",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  botBubble: { backgroundColor: "#f4f6f8" },
  userBubble: { backgroundColor: "#e8f5e9" },

  botName: { color: "#2e7d32", fontWeight: "700", marginBottom: 6 },
  msgText: { fontSize: 15, lineHeight: 20, color: "#222" },
  dot: { width: 6, height: 6, marginRight: 4, borderRadius: 3, backgroundColor: "#999" },

  inputBar: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#eee",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
  },
  iconBtn: {
    width: 34, height: 34, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  textInput: {
    flex: 1, height: 38, borderRadius: 10,
    borderWidth: 1, borderColor: "#ddd",
    paddingHorizontal: 10, fontSize: 15, backgroundColor: "#fff",
  },
  goBtn: {
    paddingHorizontal: 16, height: 38, borderRadius: 10,
    backgroundColor: "#2e7d32", alignItems: "center", justifyContent: "center",
  },
  goDisabled: { backgroundColor: "#bdbdbd" },
  goText: { color: "#fff", fontWeight: "700" },

  emojiPanel: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#eee",
    backgroundColor: "#fafafa",
    paddingHorizontal: 8,
    paddingTop: 10,
    height: 220,
  },
  emojiTitle: { fontWeight: "700", marginLeft: 4, marginBottom: 6, color: "#333" },
  emojiGrid: { flexDirection: "row", flexWrap: "wrap" },
  emojiBtn: { width: "12.5%", aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  emojiText: { fontSize: 26 },
});
