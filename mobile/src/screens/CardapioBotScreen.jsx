// mobile/src/screens/CardapioBotScreen.jsx
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
  Alert,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

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
  const headerHeight = useHeaderHeight();

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

      // Mensagem normal do bot
      const botMsg = {
        id: String(Date.now() + 1),
        role: "bot",
        text: parsed.cleanText,
      };

      // Se veio cardápio estruturado -> gera PDF
      if (parsed.menuChip) {
        try {
          const pdfUri = await generateMenuPdf(parsed.menuChip);
          const pdfMsg = {
            id: String(Date.now() + 2),
            role: "bot",
            text: `Cardápio gerado em PDF: ${parsed.menuChip.title}${parsed.menuChip.dateRange ? " (" + parsed.menuChip.dateRange + ")" : ""}`,
            pdfUri,
          };
          setMessages(prev =>
            prev
              .filter((m) => m.id !== "typing")
              .concat(botMsg, pdfMsg)
          );
        } catch (err) {
          console.warn("Falha ao gerar PDF:", err);
          const warnMsg = {
            id: String(Date.now() + 3),
            role: "bot",
            text: "Gerei o cardápio, mas não consegui criar o PDF automaticamente. Tente novamente.",
          };
          setMessages(prev =>
            prev
              .filter((m) => m.id !== "typing")
              .concat(botMsg, warnMsg)
          );
        }
      } else {
        setMessages(prev => prev.filter((m) => m.id !== "typing").concat(botMsg));
      }

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

  function buildPrompt(userText, ctx = {}) {
  return `
Você é o **CardapioBot**, um assistente culinário em pt-BR para planejamento de refeições.
Fale sempre português do Brasil, direto e educado. Use medidas do Brasil (g, ml, xíc. = 240 ml, col. sopa = 15 ml, col. chá = 5 ml). Preços em BRL (R$). Números com vírgula decimal.

## Objetivo
Interpretar o pedido do usuário e:
- **Conversar brevemente** quando for bate-papo.
- **Gerar cardápio** quando solicitado (semanal/diário/um período específico), **respeitando** preferências, restrições, alergias, orçamento, tempo, equipamentos, e itens disponíveis na despensa.

## Regras de planejamento
- Se faltarem detalhes críticos (ex.: alergia declarada mas sem lista), **assuma padrões seguros** e liste hipóteses em \`assumptions\`.
- Dê preferência a ingredientes sazonais no Brasil e a preparos simples quando houver restrição de tempo/equipamentos.
- Se o usuário informar **itens disponíveis (despensa/geladeira)**, **priorize usá-los**.
- Permita **substituições** (vegano/vegetariano/halal/kosher/sem lactose/sem glúten/low-FODMAP/diabetes/hipertensão/keto/low-carb/high-protein, etc.).
- Evite ingredientes proibidos e **garanta ausência total** dos alergênicos indicados.
- Opcionalmente, faça *batch cooking* (adiantando preparos para a semana) quando fizer sentido.
- Nutrição: quando pedido, informe **kcal** e **macros** (carbs_g, protein_g, fat_g) por refeição e por dia (estimativas).

## Quando gerar cardápio (pedido explícito ou implícito):
1) Dê uma resposta curta explicando o racional.
2) Em seguida, **obrigatoriamente** inclua **um único** bloco \`<MENU>{...}</MENU>\` contendo **JSON válido** (sem comentários, sem \`undefined\`, sem vírgulas sobrando, sem markdown dentro). Use **aspas duplas** nas chaves/valores.

## Esquema do JSON dentro de <MENU>…</MENU>
{
  "type": "menu_chip",
  "title": string,                          // ex.: "Cardápio Semanal Balanceado"
  "dateRange": string|null,                 // ex.: "10/11 - 16/11"
  "servings": integer|null,                 // por pessoa/refeição se indicado
  "constraints": {                          // tudo opcional
    "diet": [string],                       // ex.: ["vegetariano","low-carb"]
    "exclusions": [string],                 // ex.: ["lactose","amendoim"]
    "budget": { "currency":"BRL","period":"weekly|daily","max": number|null },
    "timePerMealMinutes": number|null,
    "equipment": [string],                  // ex.: ["fogão","airfryer","micro-ondas"]
    "origins": [string]                     // culinárias desejadas
  },
  "assumptions": [string],                  // hipóteses tomadas por falta de dados
  "menu": {
    "dias": [
      {
        "dia": "Segunda-feira",
        "refeicoes": [
          {
            "nome": "Café da manhã",
            "itens": [string],              // ex.: ["Omelete de 2 ovos com espinafre"]
            "kcal": number|null,
            "macros": { "carbs_g":number|null, "protein_g":number|null, "fat_g":number|null },
            "prep": [string],               // passos curtos
            "observacoes": string|null
          }
          // ... almoço, lanche, jantar, ceia (quando aplicável)
        ]
      }
      // ... 7 dias ou conforme período pedido
    ]
  },
  "shoppingList": [                         // consolidada e deduplicada
    {
      "categoria": "Hortifruti",
      "itens": [
        { "nome":"Banana", "quantidade":"10 un", "observacao":"" }
      ]
    }
    // ... Açougue, Laticínios, Mercearia, Congelados, Temperos etc.
  ],
  "prepBatching": [                          // tarefas de adiantamento
    { "dia": "Domingo", "tarefas": ["Cozinhar 1 kg de feijão e porcionar"] }
  ],
  "substitutions": [                          // guias de troca por restrição/preço/gosto
    { "original":"Leite", "alternativas":["Leite sem lactose","Bebida vegetal (aveia)"] }
  ],
  "costEstimate": {                           // estimativa simples, se orçamento for relevante
    "currency": "BRL",
    "total": number|null,
    "porDia": number|null,
    "assumptions": [string]
  }
}

## Formatação da resposta
- Mensagem normal: **curta**, clara e em pt-BR.
- Depois, **apenas um** bloco \`<MENU>{…}</MENU>\` quando houver cardápio.
- **Nunca** inclua markdown, crases, comentários ou texto extra **dentro** do JSON.
- **Nunca** use valores \`NaN\` ou \`undefined\` no JSON.

## Contexto opcional vindo do app (JSON livre)
${JSON.stringify(ctx || {}, null, 2)}

## Mensagem do usuário
"""${userText}"""
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

  /** Converte o menu estruturado para HTML e gera o PDF; retorna URI do arquivo salvo. */
  async function generateMenuPdf(menuChip) {
    const title = menuChip.title || "CARDÁPIO SEMANAL";
    const range = menuChip.dateRange ? ` (${menuChip.dateRange})` : "";
    const menu = menuChip.payload || {};

    const html = buildMenuHtml(title, range, menu);
    const file = await Print.printToFileAsync({ html });

    // nomeia o arquivo de forma legível
    const safeTitle = title.replace(/[^\w\- ]+/g, "").replace(/\s+/g, "_");
    const filename = `${safeTitle}${menuChip.dateRange ? "_" + menuChip.dateRange.replace(/[^\d\-]/g, "") : ""}.pdf`;
    const dest = FileSystem.documentDirectory + filename;

    // move para DocumentDirectory (permite compartilhar/abrir melhor)
    await FileSystem.moveAsync({ from: file.uri, to: dest });

    // tenta abrir/compartilhar automaticamente
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(dest, { mimeType: "application/pdf", dialogTitle: filename });
      }
    } catch (err) {
      // tudo bem, ainda mostramos uma mensagem com o caminho
      console.warn("Compartilhar falhou:", err);
    }

    return dest;
  }

  /** Gera HTML simples e bonito para o cardápio */
  function buildMenuHtml(title, range, menu) {
    const dias = Array.isArray(menu?.dias) ? menu.dias : [];

    const rows = dias
      .map((d) => {
        const refeicoes = Array.isArray(d.refeicoes) ? d.refeicoes : [];
        const blocos = refeicoes
          .map((r) => {
            const itens = Array.isArray(r.itens) ? r.itens : [];
            const li = itens.map((x) => `<li>${escapeHtml(String(x))}</li>`).join("");
            return `
              <div class="meal">
                <div class="meal-title">${escapeHtml(String(r.nome || ""))}</div>
                <ul>${li}</ul>
              </div>`;
          })
          .join("");

        return `
          <tr>
            <td class="day-cell">
              <div class="day-name">${escapeHtml(String(d.dia || ""))}</div>
              <div class="meals">${blocos}</div>
            </td>
          </tr>`;
      })
      .join("");

    return `
      <!doctype html>
      <html lang="pt-br">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>${escapeHtml(title)}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: -apple-system, Roboto, "Segoe UI", Arial, sans-serif; margin: 24px; color: #1f2937; }
          h1 { margin: 0 0 4px 0; font-size: 22px; color: #0b2e0f; }
          .range { color: #374151; margin-bottom: 16px; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; }
          tr + tr td { border-top: 1px solid #e5e7eb; }
          .day-cell { padding: 14px 8px; }
          .day-name { font-weight: 700; margin-bottom: 8px; font-size: 15px; color: #065f46; }
          .meal { margin-bottom: 10px; }
          .meal-title { font-weight: 700; font-size: 14px; margin-bottom: 4px; color: #111827; }
          ul { margin: 0 0 6px 16px; padding: 0; }
          li { line-height: 1.35; font-size: 13px; }
          .footer { margin-top: 18px; font-size: 11px; color: #6b7280; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        ${range ? `<div class="range">${escapeHtml(range)}</div>` : ""}
        <table>${rows}</table>
        <div class="footer">Gerado automaticamente pelo CardapioBot.</div>
      </body>
      </html>
    `;
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  const renderItem = ({ item }) => {
    // “digitando…”
    if (item.isTyping) {
      return (
        <View style={[styles.row, styles.left]}>
          <View style={[styles.bubble, styles.botBubble]}>
            <TypingDots />
          </View>
        </View>
      );
    }

    const isPdf = !!item.pdfUri;

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

          {/* Bolha com ação para abrir/compartilhar PDF */}
          {isPdf && (
            <TouchableOpacity
              onPress={async () => {
                try {
                  if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(item.pdfUri, {
                      mimeType: "application/pdf",
                      dialogTitle: "Cardápio em PDF",
                    });
                  } else {
                    Alert.alert("PDF gerado", `Arquivo salvo em:\n${item.pdfUri}`);
                  }
                } catch (err) {
                  Alert.alert("Erro", "Não foi possível abrir/compartilhar o PDF.");
                }
              }}
              style={styles.pdfChip}
              activeOpacity={0.85}
            >
              <Ionicons name="document-text-outline" size={24} />
              <Text style={styles.pdfText}>Abrir / Compartilhar PDF</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? headerHeight : 0}
      >
        <FlatList
          ref={listRef}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 75,
            paddingBottom: 50 + (showEmoji ? 220 : 0),
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
    paddingBottom: 30,
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

  // PDF chip
  pdfChip: {
    marginTop: 10,
    backgroundColor: "#d1fae5",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pdfText: { fontWeight: "700", color: "#065f46" },

  // emojis
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