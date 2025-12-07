import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import DefaultButton from "./DefaultButton";

export default function SuccessModal({ visible, onClose, buttonAction }) {
    return (
        <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
        >
        <View style={styles.overlay}>
            <View style={styles.modal}>
                <View style={styles.iconContainer}>
                    <View style={styles.circle}>
                    <Ionicons name="checkmark" size={32} color={colors.primary} />
                    </View>
                </View>

                <Text style={styles.title}>Conta criada com sucesso</Text>
                <Text style={styles.subtitle}>
                    Aproveite as funções do App livremente.
                </Text>

                <DefaultButton
                    variant="primary"
                    onPress={onClose}
                    style={{ width: "80%", marginTop: 16 }}
                >Concluir</DefaultButton>
            </View>
        </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.3)",
        alignItems: "center",
        justifyContent: "center",
    },
    modal: {
        backgroundColor: colors.background,
        borderRadius: 20,
        padding: 24,
        width: "85%",
        alignItems: "center",
    },
    iconContainer: { marginBottom: 16 },
    circle: {
        backgroundColor: "#E6F4EC",
        borderRadius: 50,
        padding: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.text,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 14,
        color: colors.mutedText,
        textAlign: "center",
        marginVertical: 8,
    },
    button: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 32,
        marginTop: 12,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
});
