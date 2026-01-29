import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * Componente que mostra a disponibilidade de ingredientes de uma receita.
 * @param {object} props
 * @param {Array} props.ingredients - Lista de ingredientes com status de disponibilidade
 * @param {function} [props.onAddToList] - Callback para adicionar faltantes à lista de compras
 */
export default function IngredientAvailability({ ingredients = [], onAddToList }) {
    const disponiveis = ingredients.filter(i => i.disponivel);
    const faltando = ingredients.filter(i => !i.disponivel);
    const vencendo = ingredients.filter(i => i.vencendo_em_dias !== null && i.vencendo_em_dias <= 7);

    const percentDisponivel = ingredients.length > 0
        ? Math.round((disponiveis.length / ingredients.length) * 100)
        : 0;

    return (
        <View style={styles.container}>
            {/* Resumo */}
            <View style={styles.summary}>
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${percentDisponivel}%` }]} />
                </View>
                <Text style={styles.summaryText}>
                    {disponiveis.length} de {ingredients.length} ingredientes disponíveis ({percentDisponivel}%)
                </Text>
            </View>

            {/* Alerta de itens vencendo */}
            {vencendo.length > 0 && (
                <View style={styles.alertContainer}>
                    <Ionicons name="time-outline" size={18} color="#FF9500" />
                    <Text style={styles.alertText}>
                        {vencendo.length} ingrediente{vencendo.length > 1 ? 's' : ''} vencendo em breve!
                    </Text>
                </View>
            )}

            {/* Lista de ingredientes */}
            <View style={styles.list}>
                {ingredients.map((ing, index) => (
                    <View key={index} style={styles.ingredient}>
                        <View style={styles.ingredientLeft}>
                            <Ionicons
                                name={ing.disponivel ? "checkmark-circle" : "close-circle"}
                                size={20}
                                color={ing.disponivel ? "#00E0A4" : "#FF3B30"}
                            />
                            <Text style={[
                                styles.ingredientName,
                                !ing.disponivel && styles.ingredientMissing
                            ]}>
                                {ing.nome}
                            </Text>
                        </View>

                        <View style={styles.ingredientRight}>
                            {ing.quantidade_necessaria && (
                                <Text style={styles.quantity}>
                                    {ing.quantidade_necessaria}{ing.unidade ? ` ${ing.unidade}` : ''}
                                </Text>
                            )}

                            {ing.disponivel && ing.vencendo_em_dias !== null && ing.vencendo_em_dias <= 7 && (
                                <View style={styles.expiringBadge}>
                                    <Text style={styles.expiringText}>
                                        {ing.vencendo_em_dias === 0
                                            ? "Hoje"
                                            : ing.vencendo_em_dias === 1
                                                ? "Amanhã"
                                                : `${ing.vencendo_em_dias}d`
                                        }
                                    </Text>
                                </View>
                            )}

                            {ing.disponivel && ing.quantidade_estoque && (
                                <Text style={styles.stockQuantity}>
                                    ({ing.quantidade_estoque} em estoque)
                                </Text>
                            )}
                        </View>
                    </View>
                ))}
            </View>

            {/* Botão para adicionar faltantes à lista */}
            {faltando.length > 0 && onAddToList && (
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => onAddToList(faltando)}
                >
                    <Ionicons name="cart-outline" size={20} color="#fff" />
                    <Text style={styles.addButtonText}>
                        Adicionar {faltando.length} item{faltando.length > 1 ? 's' : ''} à lista de compras
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
    },

    summary: {
        marginBottom: 16,
    },
    progressContainer: {
        height: 8,
        backgroundColor: "#f0f0f0",
        borderRadius: 4,
        overflow: "hidden",
        marginBottom: 8,
    },
    progressBar: {
        height: "100%",
        backgroundColor: "#00E0A4",
        borderRadius: 4,
    },
    summaryText: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
    },

    alertContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF3E0",
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
    },
    alertText: {
        marginLeft: 8,
        color: "#E65100",
        fontSize: 13,
        fontWeight: "500",
    },

    list: {
        gap: 8,
    },
    ingredient: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    ingredientLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    ingredientName: {
        marginLeft: 10,
        fontSize: 15,
        color: "#333",
    },
    ingredientMissing: {
        color: "#999",
        textDecorationLine: "line-through",
    },
    ingredientRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    quantity: {
        fontSize: 13,
        color: "#666",
    },
    stockQuantity: {
        fontSize: 12,
        color: "#999",
    },
    expiringBadge: {
        backgroundColor: "#FFF3E0",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    expiringText: {
        fontSize: 11,
        color: "#FF9500",
        fontWeight: "600",
    },

    addButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#007AFF",
        padding: 14,
        borderRadius: 10,
        marginTop: 16,
    },
    addButtonText: {
        color: "#fff",
        fontWeight: "600",
        marginLeft: 8,
    },
});
