// Painel de contexto manual do CardapioBot: resumo do perfil, itens a vencer,
// estoque editável e o formulário de planejamento (período, dieta, macros...).
import React from "react";
import { ScrollView, Text, TextInput, View } from "react-native";

import {
  CUISINE_OPTIONS,
  DIET_OPTIONS,
  EQUIPMENT_OPTIONS,
  MEAL_OPTIONS,
  PRIORITY_OPTIONS,
  PROFILE_SNAPSHOT,
  RANGE_OPTIONS,
  SAMPLE_PANTRY_PLACEHOLDER,
} from "../../utils/cardapioConstants";
import { styles } from "./cardapioStyles";
import { Chip, InfoBadge, LabeledInput, Section } from "./primitives";
import { QuickPrompts } from "./QuickPrompts";

export function ManualContextPanel({ gen, pantry, lastMenuChip, onQuickPrompt }) {
  const {
    selectedRange,
    setSelectedRange,
    selectedMeals,
    setSelectedMeals,
    dietTags,
    setDietTags,
    allergyNotes,
    setAllergyNotes,
    contextNotes,
    setContextNotes,
    servings,
    setServings,
    budget,
    setBudget,
    timePerMeal,
    setTimePerMeal,
    macroTarget,
    handleMacroChange,
    goal,
    setGoal,
    selectedEquipment,
    setSelectedEquipment,
    selectedOrigins,
    setSelectedOrigins,
    prioritized,
    setPrioritized,
    toggleSelection,
  } = gen;

  const { expiringItems, editablePantryText, setEditablePantryText, setPantryTextDirty, pantryItems } = pantry;

  return (
    <View style={styles.manualContextWrapper}>
      <ScrollView
        nestedScrollEnabled
        contentContainerStyle={styles.manualContextScroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroEyebrow}>Assistente IA</Text>
            <Text style={styles.heroTitle}>Oi, {PROFILE_SNAPSHOT.name.split(" ")[0]}!</Text>
            <Text style={styles.heroSubtitle}>
              Conte o que precisa e eu gero um cardápio completo seguindo preferências, estoque e metas.
            </Text>
          </View>
          <InfoBadge label="Assistente" value="CardapioBot IA" compact />
        </View>

        <Section title="Resumo rápido" description="Dados vindos do perfil e onboarding.">
          <View style={styles.badgeRow}>
            <InfoBadge label="Estilo alimentar" value={PROFILE_SNAPSHOT.dietaryStyle.join(", ")} />
            <InfoBadge label="Alergias" value={PROFILE_SNAPSHOT.allergies.join(" • ")} variant="warning" />
          </View>
          <View style={styles.badgeRow}>
            <InfoBadge label="Metas" value={PROFILE_SNAPSHOT.goals.join(", ")} />
            <InfoBadge label="Meta calórica" value={`${PROFILE_SNAPSHOT.macros.kcal} kcal`} />
          </View>
        </Section>

        {lastMenuChip && (
          <Section title="Último cardápio gerado" description="Use como referência para manter consistência.">
            <Text style={styles.lastMenuTitle}>{lastMenuChip.title}</Text>
            {lastMenuChip.dateRange && <Text style={styles.lastMenuRange}>{lastMenuChip.dateRange}</Text>}
            <Text style={styles.lastMenuStamp}>
              Atualizado em {new Date(lastMenuChip.generatedAt).toLocaleString("pt-BR")}
            </Text>
            <View style={styles.badgeRow}>
              {(lastMenuChip.data?.constraints?.diet || []).map((item) => (
                <Chip key={item} label={item} selected />
              ))}
            </View>
          </Section>
        )}

        <Section title="Itens para priorizar" description="Aproveite antes de vencer.">
          {expiringItems.length ? (
            expiringItems.map((item) => (
              <View key={item.id} style={styles.expiringRow}>
                <Text style={styles.expiringName}>{item.name}</Text>
                {!!item.expiresIn && <Text style={styles.expiringTag}>{item.expiresIn}</Text>}
              </View>
            ))
          ) : (
            <Text style={styles.helperText}>Nenhum item com vencimento próximo.</Text>
          )}
        </Section>

        <Section title="Estoque enviado para o Gemini" description="Edite a lista ou escreva novos itens.">
          <TextInput
            style={[styles.textArea, styles.pantryEditor]}
            value={editablePantryText}
            onChangeText={(value) => {
              setPantryTextDirty(true);
              setEditablePantryText(value);
            }}
            multiline
            scrollEnabled
            textAlignVertical="top"
            placeholder="Peito de frango - 1,2 kg - Freezer"
          />
          <Text style={styles.helperText}>Formato sugerido: ingrediente - quantidade - local (um por linha).</Text>
          <View style={styles.pantryGrid}>
            {(pantryItems.length ? pantryItems : SAMPLE_PANTRY_PLACEHOLDER).map((item) => {
              const qty =
                typeof item.quantity === "string"
                  ? item.quantity
                  : item.quantity
                  ? String(item.quantity)
                  : null;
              return (
                <View key={item.id} style={styles.pantryPill}>
                  <Text style={styles.pantryName}>{item.name}</Text>
                  <Text style={styles.pantryMeta}>
                    {qty || "Qtd. não informada"} • {item.location || "Local não informado"}
                  </Text>
                </View>
              );
            })}
          </View>
        </Section>

        <Section title="Período e refeições" description="Selecione dias e refeições desejados.">
          <Text style={styles.sectionLabel}>Período</Text>
          <View style={styles.pillRow}>
            {RANGE_OPTIONS.map((option) => (
              <Chip key={option} label={option} selected={selectedRange === option} onPress={() => setSelectedRange(option)} />
            ))}
          </View>

          <Text style={styles.sectionLabel}>Refeições</Text>
          <View style={styles.pillRow}>
            {MEAL_OPTIONS.map((meal) => (
              <Chip
                key={meal}
                label={meal}
                selected={selectedMeals.includes(meal)}
                onPress={() => toggleSelection(meal, setSelectedMeals)}
              />
            ))}
          </View>
        </Section>

        <Section title="Preferências & restrições" description="Atualize quando algo mudar.">
          <Text style={styles.sectionLabel}>Estilo alimentar</Text>
          <View style={styles.pillRow}>
            {DIET_OPTIONS.map((diet) => (
              <Chip
                key={diet}
                label={diet}
                selected={dietTags.includes(diet)}
                onPress={() => toggleSelection(diet, setDietTags)}
              />
            ))}
          </View>

          <Text style={styles.sectionLabel}>Alergias / restrições</Text>
          <TextInput
            style={[styles.textArea, { marginBottom: 8 }]}
            value={allergyNotes}
            onChangeText={setAllergyNotes}
            placeholder="Ex.: lactose severa; evitar camarão"
          />

          <Text style={styles.sectionLabel}>Observações adicionais</Text>
          <TextInput
            style={styles.textArea}
            value={contextNotes}
            onChangeText={setContextNotes}
            placeholder="Preferências, eventos, convidados..."
            multiline
          />
        </Section>

        <Section title="Macros, metas e orçamento" description="Os valores alimentam o prompt automaticamente.">
          <View style={styles.inputsRow}>
            <LabeledInput label="Porções" value={servings} onChangeText={setServings} keyboardType="numeric" style={{ flex: 1 }} />
            <LabeledInput label="Orçamento semanal (R$)" value={budget} onChangeText={setBudget} keyboardType="numeric" style={{ flex: 1.2 }} />
            <LabeledInput label="Tempo por refeição (min)" value={timePerMeal} onChangeText={setTimePerMeal} keyboardType="numeric" style={{ flex: 1.2 }} />
          </View>

          <Text style={[styles.sectionLabel, { marginTop: 10 }]}>Meta de macros</Text>
          <View style={styles.inputsRow}>
            <LabeledInput label="Kcal" value={macroTarget.kcal} onChangeText={(v) => handleMacroChange("kcal", v)} keyboardType="numeric" />
            <LabeledInput label="Proteína (g)" value={macroTarget.protein} onChangeText={(v) => handleMacroChange("protein", v)} keyboardType="numeric" />
          </View>
          <View style={styles.inputsRow}>
            <LabeledInput label="Carbo (g)" value={macroTarget.carbs} onChangeText={(v) => handleMacroChange("carbs", v)} keyboardType="numeric" />
            <LabeledInput label="Gordura (g)" value={macroTarget.fat} onChangeText={(v) => handleMacroChange("fat", v)} keyboardType="numeric" />
          </View>

          <Text style={styles.sectionLabel}>Objetivo da semana</Text>
          <TextInput
            style={styles.textArea}
            value={goal}
            onChangeText={setGoal}
            placeholder="Ex.: Montar marmitas para treino matinal"
          />
        </Section>

        <Section title="Equipamentos e culinárias" description="Ajuda o bot a respeitar estrutura da cozinha.">
          <Text style={styles.sectionLabel}>Equipamentos disponíveis</Text>
          <View style={styles.pillRow}>
            {EQUIPMENT_OPTIONS.map((item) => (
              <Chip
                key={item}
                label={item}
                selected={selectedEquipment.includes(item)}
                onPress={() => toggleSelection(item, setSelectedEquipment)}
              />
            ))}
          </View>

          <Text style={styles.sectionLabel}>Culinárias desejadas</Text>
          <View style={styles.pillRow}>
            {CUISINE_OPTIONS.map((item) => (
              <Chip
                key={item}
                label={item}
                selected={selectedOrigins.includes(item)}
                onPress={() => toggleSelection(item, setSelectedOrigins)}
              />
            ))}
          </View>

          <Text style={styles.sectionLabel}>Itens que quero priorizar</Text>
          <View style={styles.pillRow}>
            {PRIORITY_OPTIONS.map((item) => (
              <Chip
                key={item}
                label={item}
                selected={prioritized.includes(item)}
                onPress={() => toggleSelection(item, setPrioritized)}
              />
            ))}
          </View>
        </Section>

        <Section title="Atalhos de pedido" description="Clique para preencher a mensagem automaticamente.">
          <QuickPrompts onSelect={onQuickPrompt} />
        </Section>
      </ScrollView>
    </View>
  );
}
