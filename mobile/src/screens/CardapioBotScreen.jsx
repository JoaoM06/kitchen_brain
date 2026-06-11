// mobile/src/screens/CardapioBotScreen.jsx
// Composição da tela do CardapioBot. A lógica vive em hooks (useCardapioBot,
// useMenuGeneration, usePantryContext, useSavedMenus) e os blocos visuais em
// components/cardapio/*. Mantém apenas a orquestração e o layout principal.
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";

import SafeScreen from "../components/SafeScreen";
import FooterNav from "../components/FooterNav";
import { MessageBubble, TypingRow } from "../components/cardapio/MessageBubble";
import { MenuChip } from "../components/cardapio/MenuChip";
import { ManualContextPanel } from "../components/cardapio/ManualContextPanel";
import { styles } from "../components/cardapio/cardapioStyles";
import { colors } from "../theme/colors";
import { EMOJIS } from "../utils/cardapioConstants";
import { useCardapioBot } from "../hooks/useCardapioBot";
import { useMenuGeneration } from "../hooks/useMenuGeneration";
import { usePantryContext } from "../hooks/usePantryContext";
import { useSavedMenus } from "../hooks/useSavedMenus";

export default function CardapioBotScreen({ navigation }) {
  const headerHeight = useHeaderHeight();
  const [useManualContext, setUseManualContext] = useState(false);

  const pantry = usePantryContext();
  const gen = useMenuGeneration();
  const saved = useSavedMenus();
  const bot = useCardapioBot();

  const buildContextNow = useCallback(
    () =>
      useManualContext
        ? gen.buildRequestContext({
            messages: bot.messages,
            manualPantrySnapshot: pantry.manualPantrySnapshot,
            expiringItems: pantry.expiringItems,
            lastMenuChip: bot.lastMenuChip,
          })
        : gen.buildDefaultContext({
            pantryItems: pantry.pantryItems,
            expiringItems: pantry.expiringItems,
          }),
    [useManualContext, gen, bot.messages, bot.lastMenuChip, pantry.manualPantrySnapshot, pantry.expiringItems, pantry.pantryItems]
  );

  const onSend = useCallback(() => bot.handleSend(buildContextNow()), [bot, buildContextNow]);

  const handleQuickPrompt = useCallback(
    (prompt) => {
      const replacements = {
        "{range}": gen.selectedRange,
        "{prioritized}": gen.prioritized.join(", "),
        "{tempo}": `${gen.timePerMeal} min`,
        "{pantry}": pantry.pantryItems.map((p) => p.name).join(", "),
        "{meals}": gen.selectedMeals.join(", "),
        "{macros}": `${gen.macroTarget.kcal} kcal / ${gen.macroTarget.protein}g proteína`,
      };
      const filled = Object.keys(replacements).reduce(
        (acc, key) => acc.split(key).join(replacements[key]),
        prompt
      );
      bot.setText(filled);
      bot.setShowEmoji(false);
      bot.inputRef.current?.focus?.();
    },
    [gen.selectedRange, gen.prioritized, gen.timePerMeal, gen.selectedMeals, gen.macroTarget, pantry.pantryItems, bot]
  );

  const renderItem = useCallback(
    ({ item }) => {
      if (item.isTyping) return <TypingRow />;
      if (item.menuChip)
        return (
          <MenuChip
            menuChip={item.menuChip}
            onSaveMenu={saved.handleSaveMenu}
            isSaved={saved.savedMenuIds.has(item.menuChip.id)}
            saving={saved.savingMenuId === item.menuChip.id}
          />
        );
      return <MessageBubble item={item} onGeneratePdf={bot.handleGeneratePdf} />;
    },
    [saved.handleSaveMenu, saved.savedMenuIds, saved.savingMenuId, bot.handleGeneratePdf]
  );

  return (
    <SafeScreen edges={["top", "bottom"]}>
      <View style={styles.screen}>
        <View style={styles.manualToggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.customizationHeaderText}>Contexto personalizado</Text>
            <Text style={styles.customizationHelper}>
              Ative para editar manualmente o contexto enviado ao Gemini.
            </Text>
          </View>
          <Switch
            value={useManualContext}
            onValueChange={setUseManualContext}
            trackColor={{ false: "#d4d4d8", true: colors.primary }}
            thumbColor="#fff"
          />
        </View>

        {useManualContext && (
          <ManualContextPanel
            gen={gen}
            pantry={pantry}
            lastMenuChip={bot.lastMenuChip}
            onQuickPrompt={handleQuickPrompt}
          />
        )}

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? headerHeight : 0}
        >
          <View style={styles.flex}>
            <FlatList
              ref={bot.listRef}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingTop: 20,
                paddingBottom: 180 + (bot.showEmoji ? 220 : 0),
              }}
              data={bot.messages}
              keyExtractor={(m) => m.id}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              initialNumToRender={10}
              maxToRenderPerBatch={8}
              windowSize={6}
              removeClippedSubviews
              onContentSizeChange={bot.scrollToEnd}
            />

            {bot.showEmoji && (
              <View style={styles.emojiPanel}>
                <Text style={styles.emojiTitle}>Emojis</Text>
                <View style={styles.emojiGrid}>
                  {EMOJIS.map((e) => (
                    <TouchableOpacity
                      key={e}
                      style={styles.emojiBtn}
                      onPress={() => {
                        bot.setText((prev) => prev + e);
                        bot.inputRef.current?.focus?.();
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
                  bot.setShowEmoji((v) => {
                    const next = !v;
                    if (next) Keyboard.dismiss();
                    else bot.inputRef.current?.focus?.();
                    return next;
                  });
                }}
              >
                <Text style={{ fontSize: 20 }}>😊</Text>
              </TouchableOpacity>

              <TextInput
                ref={bot.inputRef}
                style={styles.textInput}
                value={bot.text}
                onChangeText={bot.setText}
                placeholder="Escreva seu pedido ou use um atalho"
                placeholderTextColor="#999"
                editable={!bot.loading}
                onFocus={() => bot.setShowEmoji(false)}
                onSubmitEditing={bot.canSend ? onSend : undefined}
                returnKeyType="send"
              />

              {bot.loading ? (
                <View style={[styles.goBtn, styles.goDisabled]}>
                  <ActivityIndicator />
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.goBtn, !bot.canSend && styles.goDisabled]}
                  disabled={!bot.canSend}
                  onPress={onSend}
                >
                  <Text style={styles.goText}>Enviar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>

        <FooterNav active="CardapioBotScreen" onNavigate={navigation?.replace} />
      </View>
    </SafeScreen>
  );
}
