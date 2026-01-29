import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import SafeScreen from "../components/SafeScreen";
import { colors } from "../theme/colors";

function extractMenuDays(data) {
  if (!data) return [];
  if (Array.isArray(data?.dias)) return data.dias;
  if (Array.isArray(data?.menu?.dias)) return data.menu.dias;
  return [];
}

function buildMenuHtml(title, range, menuData) {
  const dias = extractMenuDays(menuData);

  const cards = dias
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
        <section class="day-card">
          <header class="day-header">
            <span class="day-label">${escapeHtml(String(d.dia || ""))}</span>
          </header>
          <div class="meals">${blocos}</div>
        </section>`;
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
        @page {
          size: A4 portrait;
          margin: 18mm;
        }
        * { box-sizing: border-box; }
        body {
          font-family: -apple-system, Roboto, "Segoe UI", Arial, sans-serif;
          margin: 0;
          padding: 0;
          color: #1f2937;
          background: #f9fafb;
        }
        main { padding: 0 18mm 18mm; }
        h1 { margin: 0 0 4px 0; font-size: 24px; color: #064e3b; }
        .range { color: #4b5563; margin-bottom: 20px; font-size: 14px; }
        .day-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 12mm;
        }
        .day-card {
          background: #fff;
          border-radius: 16px;
          padding: 14px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .day-header {
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 12px;
          padding-bottom: 8px;
        }
        .day-label { font-weight: 700; color: #065f46; font-size: 15px; text-transform: uppercase; }
        .meal { margin-bottom: 12px; }
        .meal:last-child { margin-bottom: 0; }
        .meal-title { font-weight: 700; font-size: 14px; margin-bottom: 4px; color: #111827; }
        ul {
          margin: 0;
          padding-left: 18px;
        }
        li { line-height: 1.4; font-size: 13px; margin-bottom: 2px; }
        .footer { margin-top: 24px; font-size: 12px; color: #6b7280; text-align: center; }
      </style>
    </head>
    <body>
      <main>
        <h1>${escapeHtml(title)}</h1>
        ${range ? `<div class="range">${escapeHtml(range)}</div>` : ""}
        <div class="day-grid">${cards}</div>
        <div class="footer">Gerado automaticamente pelo CardapioBot.</div>
      </main>
    </body>
    </html>
  `;
}

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function generateMenuPdf(menuChip) {
  const title = menuChip.title || "CARDÁPIO SEMANAL";
  const range = menuChip.dateRange ? ` (${menuChip.dateRange})` : "";
  const html = buildMenuHtml(title, range, menuChip.data);
  const file = await Print.printToFileAsync({ html });

  const safeTitle = title.replace(/[^\w\- ]+/g, "").replace(/\s+/g, "_");
  const filename = `${safeTitle}${menuChip.dateRange ? "_" + menuChip.dateRange.replace(/[^\d\-]/g, "") : ""}.pdf`;
  const dest = FileSystem.documentDirectory + filename;

  await FileSystem.moveAsync({ from: file.uri, to: dest });
  return { uri: dest, name: filename };
}

export default function MenuViewScreen({ route, navigation }) {
  const { menu } = route.params;
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const days = extractMenuDays(menu.data);
  const shopping = Array.isArray(menu.data?.shoppingList) ? menu.data.shoppingList : [];
  const assumptions = Array.isArray(menu.data?.assumptions) ? menu.data.assumptions : [];
  const constraints = menu.data?.constraints || {};
  const prepBatching = Array.isArray(menu.data?.prepBatching) ? menu.data.prepBatching : [];

  const handleGeneratePdf = async () => {
    setGeneratingPdf(true);
    try {
      const pdfFile = await generateMenuPdf(menu);
      await sharePdf(pdfFile.uri, pdfFile.name);
    } catch (err) {
      console.warn("Erro ao gerar PDF:", err);
      Alert.alert("Erro", "Não foi possível gerar o PDF.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const sharePdf = async (uri, name = "Cardápio em PDF") => {
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
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: finalName,
        });
      } else {
        Alert.alert("PDF gerado", `${finalName}\n${uri}`);
      }
    } catch (err) {
      Alert.alert("Erro", "Não foi possível abrir/compartilhar o PDF.");
    }
  };

  return (
    <SafeScreen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cardápio</Text>
        <TouchableOpacity
          onPress={handleGeneratePdf}
          disabled={generatingPdf}
          style={styles.pdfButton}
        >
          {generatingPdf ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Ionicons name="download-outline" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.menuTitle}>{menu.title}</Text>
          {menu.dateRange && <Text style={styles.menuSubtitle}>{menu.dateRange}</Text>}
        </View>

        {(constraints.diet?.length > 0 || constraints.timePerMealMinutes || constraints.budget?.max) && (
          <View style={styles.constraintsSection}>
            <View style={styles.constraintRow}>
              {(constraints.diet || []).map((item) => (
                <View key={item} style={styles.constraintChip}>
                  <Text style={styles.constraintChipText}>{item}</Text>
                </View>
              ))}
              {constraints.timePerMealMinutes && (
                <View style={styles.constraintChip}>
                  <Text style={styles.constraintChipText}>{constraints.timePerMealMinutes} min/ref.</Text>
                </View>
              )}
              {constraints.budget?.max && (
                <View style={styles.constraintChip}>
                  <Text style={styles.constraintChipText}>
                    R$ {constraints.budget.max}/{constraints.budget.period === "daily" ? "dia" : "semana"}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {days.map((day, dayIndex) => (
          <View key={dayIndex} style={styles.dayCard}>
            <Text style={styles.dayTitle}>{day.dia}</Text>
            {(day.refeicoes || []).map((meal, mealIndex) => (
              <View key={mealIndex} style={styles.mealCard}>
                <Text style={styles.mealTitle}>{meal.nome}</Text>
                {(meal.itens || []).map((item, itemIndex) => (
                  <Text key={itemIndex} style={styles.mealItem}>• {item}</Text>
                ))}
                {meal.kcal && (
                  <Text style={styles.mealKcal}>{meal.kcal} kcal</Text>
                )}
                {meal.macros && (meal.macros.protein_g || meal.macros.carbs_g || meal.macros.fat_g) && (
                  <Text style={styles.mealMacros}>
                    {meal.macros.protein_g ? `Proteína: ${meal.macros.protein_g}g  ` : ""}
                    {meal.macros.carbs_g ? `Carbs: ${meal.macros.carbs_g}g  ` : ""}
                    {meal.macros.fat_g ? `Gordura: ${meal.macros.fat_g}g` : ""}
                  </Text>
                )}
                {meal.observacoes && (
                  <Text style={styles.mealObs}>💡 {meal.observacoes}</Text>
                )}
              </View>
            ))}
          </View>
        ))}

        {shopping.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Lista de Compras</Text>
            {shopping.map((group, idx) => (
              <View key={idx} style={styles.shoppingGroup}>
                <Text style={styles.shoppingCategory}>{group.categoria}</Text>
                {(group.itens || []).map((item, itemIdx) => (
                  <Text key={itemIdx} style={styles.shoppingItem}>
                    • {item.nome} - {item.quantidade}
                    {item.observacao && ` (${item.observacao})`}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {prepBatching.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🍳 Batch Cooking</Text>
            {prepBatching.map((batch, idx) => (
              <View key={idx} style={styles.batchGroup}>
                <Text style={styles.batchDay}>{batch.dia}</Text>
                {(batch.tarefas || []).map((task, taskIdx) => (
                  <Text key={taskIdx} style={styles.batchTask}>• {task}</Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {assumptions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ℹ️ Assunções</Text>
            {assumptions.map((assumption, idx) => (
              <Text key={idx} style={styles.assumption}>• {assumption}</Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  pdfButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  titleSection: {
    marginBottom: 16,
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 16,
    color: colors.mutedText,
  },
  constraintsSection: {
    marginBottom: 16,
  },
  constraintRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  constraintChip: {
    backgroundColor: colors.primary50,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  constraintChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  dayCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mealCard: {
    marginBottom: 16,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 6,
  },
  mealItem: {
    fontSize: 14,
    color: colors.mutedText,
    lineHeight: 20,
    marginLeft: 8,
  },
  mealKcal: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
    marginTop: 4,
    marginLeft: 8,
  },
  mealMacros: {
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 2,
    marginLeft: 8,
  },
  mealObs: {
    fontSize: 12,
    color: "#f59e0b",
    fontStyle: "italic",
    marginTop: 4,
    marginLeft: 8,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  shoppingGroup: {
    marginBottom: 12,
  },
  shoppingCategory: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  shoppingItem: {
    fontSize: 13,
    color: colors.mutedText,
    lineHeight: 20,
    marginLeft: 8,
  },
  batchGroup: {
    marginBottom: 12,
  },
  batchDay: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  batchTask: {
    fontSize: 13,
    color: colors.mutedText,
    lineHeight: 20,
    marginLeft: 8,
  },
  assumption: {
    fontSize: 13,
    color: colors.mutedText,
    lineHeight: 20,
    marginBottom: 4,
  },
});
