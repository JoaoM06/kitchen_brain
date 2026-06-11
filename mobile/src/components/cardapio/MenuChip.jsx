// Card visual do cardápio gerado (preview com dias, lista de compras, salvar).
import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../../theme/colors";
import { extractMenuDays } from "../../utils/menuParser";
import { styles } from "./cardapioStyles";

function MenuPreview({ menuChip, onSaveMenu, isSaved, isSaving }) {
  const days = extractMenuDays(menuChip.data);
  const shopping = Array.isArray(menuChip.data?.shoppingList) ? menuChip.data.shoppingList : [];
  const assumptions = Array.isArray(menuChip.data?.assumptions) ? menuChip.data.assumptions : [];
  const constraints = menuChip.data?.constraints || {};

  return (
    <View style={styles.menuCard}>
      <Text style={styles.menuTitle}>{menuChip.title}</Text>
      {menuChip.dateRange && <Text style={styles.menuSubtitle}>{menuChip.dateRange}</Text>}

      <View style={styles.menuConstraintRow}>
        {(constraints.diet || []).map((item) => (
          <Text key={item} style={styles.menuConstraintChip}>{item}</Text>
        ))}
        {constraints.timePerMealMinutes && (
          <Text style={styles.menuConstraintChip}>{constraints.timePerMealMinutes} min/ref.</Text>
        )}
        {constraints.budget?.max && (
          <Text style={styles.menuConstraintChip}>R$ {constraints.budget.max}/{constraints.budget.period === "daily" ? "dia" : "semana"}</Text>
        )}
      </View>

      {days.map((day) => (
        <View key={day.dia} style={styles.menuDay}>
          <Text style={styles.menuDayTitle}>{day.dia}</Text>
          {(day.refeicoes || []).map((meal) => (
            <View key={`${day.dia}-${meal.nome}`} style={styles.menuMeal}>
              <Text style={styles.menuMealTitle}>{meal.nome}</Text>
              <Text style={styles.menuMealText}>{(meal.itens || []).join(" • ")}</Text>
            </View>
          ))}
        </View>
      ))}

      {shopping.length > 0 && (
        <View style={styles.shoppingBlock}>
          <Text style={styles.menuSectionLabel}>Lista de compras</Text>
          {shopping.map((group) => (
            <View key={group.categoria} style={styles.shoppingRow}>
              <Text style={styles.shoppingCategory}>{group.categoria}</Text>
              <Text style={styles.shoppingItems}>
                {(group.itens || []).map((item) => item.nome).join(", ")}
              </Text>
            </View>
          ))}
        </View>
      )}

      {assumptions.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.menuSectionLabel}>Assunções</Text>
          {assumptions.map((item, idx) => (
            <Text key={idx} style={styles.assumptionText}>• {item}</Text>
          ))}
        </View>
      )}

      <View style={styles.menuActions}>
        <TouchableOpacity
          style={[
            styles.saveMenuBtn,
            (isSaved || isSaving) && styles.saveMenuBtnDisabled,
            isSaved && styles.saveMenuBtnSaved,
          ]}
          onPress={() => onSaveMenu?.(menuChip)}
          disabled={isSaved || isSaving}
          activeOpacity={0.9}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons
                name={isSaved ? "checkmark-circle" : "bookmark-outline"}
                size={18}
                color={isSaved ? colors.primary : "#fff"}
                style={styles.saveMenuIcon}
              />
              <Text style={[styles.saveMenuText, isSaved && styles.saveMenuTextSaved]}>
                {isSaved ? "Cardápio salvo" : "Salvar no perfil"}
              </Text>
            </>
          )}
        </TouchableOpacity>
        {isSaved && <Text style={styles.saveMenuHint}>Perfil › Cardápios</Text>}
      </View>
    </View>
  );
}

export const MenuChip = React.memo(({ menuChip, onSaveMenu, isSaved, saving }) => (
  <View style={[styles.row, styles.left]}>
    <MenuPreview
      menuChip={menuChip}
      onSaveMenu={onSaveMenu}
      isSaved={isSaved}
      isSaving={saving}
    />
  </View>
));
MenuChip.displayName = "MenuChip";
