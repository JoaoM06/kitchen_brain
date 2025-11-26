import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View, Platform, Pressable, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Video } from "expo-av";
import SafeScreen from "../components/SafeScreen";
import DefaultButton from "../components/DefaultButton";
import { colors } from "../theme/colors";
import { addCommunityPost } from "../storage/recipeHub";

const difficulties = ["Fácil", "Intermediário", "Avançado"];

export default function RecipeHubCreateScreen({ navigation }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");
  const [tags, setTags] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [difficulty, setDifficulty] = useState("Fácil");
  const [image, setImage] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorHandle, setAuthorHandle] = useState("");
  const [media, setMedia] = useState(null); // { uri, type }
  const [submitting, setSubmitting] = useState(false);

  const requestLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão negada", "Precisamos acessar sua galeria para selecionar mídias.");
      return false;
    }
    return true;
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão negada", "Precisamos acessar a câmera para capturar mídias.");
      return false;
    }
    return true;
  };

  const pickFromLibrary = async () => {
    const granted = await requestLibraryPermission();
    if (!granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.85,
      videoMaxDuration: 120,
    });
    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      setMedia({
        uri: asset.uri,
        type: asset.type?.startsWith("video") ? "video" : "image",
      });
    }
  };

  const captureMedia = async () => {
    const granted = await requestCameraPermission();
    if (!granted) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.85,
      videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      setMedia({
        uri: asset.uri,
        type: asset.type?.startsWith("video") ? "video" : "image",
      });
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert("Hub", "Dê um título e uma descrição para sua receita.");
      return;
    }
    setSubmitting(true);
    try {
      await addCommunityPost({
        title,
        description,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        ingredients: ingredients
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        steps: steps
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        prepTime,
        difficulty,
        image: media?.type === "image" ? media?.uri : image.trim() || null,
        videoUri: media?.type === "video" ? media?.uri : null,
        mediaUri: media?.uri || null,
        mediaType: media?.type || (image.trim() ? "image" : "image"),
        author: {
          name: authorName.trim() || "Você",
          handle: authorHandle.trim() || "@voce.na.cozinha",
          avatar: null,
        },
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: 0,
        saves: 0,
        rating: 0,
      });
      Alert.alert("Receita publicada", "Sua receita já está disponível no hub!", [
        { text: "Ver feed", onPress: () => navigation.navigate("RecipeHub") },
      ]);
      setTitle("");
      setDescription("");
      setIngredients("");
      setSteps("");
      setTags("");
      setPrepTime("");
      setImage("");
      setAuthorName("");
      setAuthorHandle("");
      setMedia(null);
    } catch (err) {
      console.warn("Erro ao publicar receita", err);
      Alert.alert("Erro", "Não foi possível publicar agora. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeScreen>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Compartilhar receita</Text>
          <View style={styles.backButton} />
        </View>
        <Text style={styles.subtitle}>Inspire outras pessoas com suas criações favoritas</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title="Informações principais">
          <LabeledInput label="Título da receita" value={title} onChangeText={setTitle} />
          <LabeledInput
            label="Descrição"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholder="Conte um pouco da história, textura e sabor..."
          />
        </Section>

        <Section title="Ingredientes (uma linha por item)">
          <LabeledInput
            value={ingredients}
            onChangeText={setIngredients}
            multiline
            numberOfLines={4}
            placeholder={"Ex:\n- 2 xíc Farinha\n- 1 colher Chá fermento"}
          />
        </Section>

        <Section title="Modo de preparo (uma linha por etapa)">
          <LabeledInput
            value={steps}
            onChangeText={setSteps}
            multiline
            numberOfLines={4}
            placeholder={"Ex:\n1. Misture secos\n2. Acrescente líquidos\n3. Asse por 20 min"}
          />
        </Section>

        <Section title="Detalhes">
          <LabeledInput
            label="Tempo de preparo"
            value={prepTime}
            onChangeText={setPrepTime}
            placeholder="Ex: 30 min"
          />
          <Text style={styles.inputLabel}>Dificuldade</Text>
          <View style={styles.choicesRow}>
            {difficulties.map((diff) => {
              const selected = diff === difficulty;
              return (
                <PressableChoice key={diff} selected={selected} onPress={() => setDifficulty(diff)}>
                  {diff}
                </PressableChoice>
              );
            })}
          </View>
          <LabeledInput
            label="Tags (separe por vírgula)"
            value={tags}
            onChangeText={setTags}
            placeholder="Veggie, Sem glúten, Sobremesa..."
          />
          <LabeledInput
            label="Link da imagem"
            value={image}
            onChangeText={setImage}
            placeholder="https://"
          />
        </Section>

        <Section title="Foto ou vídeo">
          <View style={styles.mediaRow}>
            <DefaultButton variant="outline" style={styles.mediaButton} onPress={pickFromLibrary}>
              Selecionar da galeria
            </DefaultButton>
            <DefaultButton variant="outline" style={styles.mediaButton} onPress={captureMedia}>
              Capturar agora
            </DefaultButton>
          </View>
          {media ? (
            <View style={styles.mediaPreview}>
              {media.type === "video" ? (
                <Video
                  source={{ uri: media.uri }}
                  style={styles.mediaContent}
                  useNativeControls
                  resizeMode="cover"
                />
              ) : (
                <Image source={{ uri: media.uri }} style={styles.mediaContent} />
              )}
              <TouchableOpacity style={styles.removeMedia} onPress={() => setMedia(null)}>
                <Ionicons name="close" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.mediaHint}>
              Adicione pelo menos uma foto ou vídeo para deixar sua receita mais inspiradora.
            </Text>
          )}
        </Section>

        <Section title="Assinatura do autor">
          <LabeledInput label="Seu nome" value={authorName} onChangeText={setAuthorName} />
          <LabeledInput
            label="@usuário ou rede"
            value={authorHandle}
            onChangeText={setAuthorHandle}
            placeholder="@meu.apelido"
          />
        </Section>

        <DefaultButton onPress={handleSubmit} style={styles.submitBtn} disabled={submitting}>
          {submitting ? "Publicando..." : "Publicar no Hub"}
        </DefaultButton>
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeScreen>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function LabeledInput({ label, style, ...rest }) {
  return (
    <View style={{ marginBottom: 16 }}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <TextInput
        {...rest}
        style={[styles.input, rest.multiline && { height: Math.max(120, rest.numberOfLines * 24) }, style]}
        placeholderTextColor={colors.mutedText}
      />
    </View>
  );
}

function PressableChoice({ children, selected, onPress }) {
  return (
    <Pressable
      style={[styles.choiceChip, selected && styles.choiceChipActive]}
      onPress={onPress}
    >
      <Text style={[styles.choiceChipText, selected && styles.choiceChipTextActive]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    color: colors.mutedText,
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.mutedText,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    color: colors.text,
    backgroundColor: "#fff",
  },
  choicesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  choiceChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 80,
    alignItems: "center",
  },
  choiceChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  choiceChipText: {
    color: colors.mutedText,
    fontWeight: "600",
  },
  choiceChipTextActive: {
    color: "#fff",
  },
  submitBtn: {
    marginTop: 8,
  },
  mediaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  mediaButton: {
    flex: 1,
  },
  mediaPreview: {
    marginTop: 12,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    position: "relative",
  },
  mediaContent: {
    width: "100%",
    height: 220,
  },
  removeMedia: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaHint: {
    color: colors.mutedText,
    marginTop: 8,
  },
});
