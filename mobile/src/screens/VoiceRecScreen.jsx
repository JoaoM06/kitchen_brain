import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  Animated,
  Easing,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
} from "react-native";
import { Audio } from "expo-av";
import { transcribeAudio } from "../api/voice";

export default function VoiceRecScreen() {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const amplitude = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);

  // Itens com imagens
  const allItems = [
    { nome: "Arroz", imagem: require("../../assets/imgs/arroz.png") },
    { nome: "Feijão", imagem: require("../../assets/imgs/feijao.png") },
    { nome: "Macarrão", imagem: require("../../assets/imgs/macarrao.png") },
    { nome: "Leite", imagem: require("../../assets/imgs/leite.png") },
    { nome: "Açúcar", imagem: require("../../assets/imgs/acucar.png") },
    { nome: "Sal", imagem: require("../../assets/imgs/sal.png") },
    { nome: "Café", imagem: require("../../assets/imgs/cafe.png") },
    { nome: "Óleo", imagem: require("../../assets/imgs/oleo.png") },
    { nome: "Manteiga", imagem: require("../../assets/imgs/manteiga.png") },
    { nome: "Carne bovina", imagem: require("../../assets/imgs/carne.png") },
    // adiciona o restante dos itens com imagens
  ];

  // Animação da auréola
  const animateWave = (value) => {
    Animated.timing(amplitude, {
      toValue: value,
      duration: 120,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  };

  // Iniciar gravação
  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert("Permissão negada", "Ative o microfone nas configurações do dispositivo.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);

      timerRef.current = setInterval(async () => {
        const status = await recording.getStatusAsync();
        if (status.isRecording) {
          const randomScale = Math.random() * 0.5 + 1;
          animateWave(randomScale);
        } else {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }, 400);
    } catch (err) {
      console.error("Erro ao iniciar gravação:", err);
      Alert.alert("Erro", "Não foi possível iniciar a gravação.");
    }
  };

  // Parar gravação
  const stopRecording = async () => {
    if (!recording) return;

    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      animateWave(1);

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      setIsRecording(false);
      setRecording(null);

      if (!uri) return;

      setLoading(true);

      const { text } = await transcribeAudio({
        uri,
        language: "pt",
      });

      setRecognizedText(text || "");
    } catch (err) {
      console.error("Erro ao transcrever:", err);
      Alert.alert("Falha na transcrição", "Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Atualiza sugestões conforme o texto digitado
  useEffect(() => {
    if (recognizedText.trim().length === 0) {
      setSuggestions([]);
      return;
    }

    const filtered = allItems.filter((item) =>
      item.nome.toLowerCase().includes(recognizedText.toLowerCase())
    );
    setSuggestions(filtered.slice(0, 5));
  }, [recognizedText]);

  const waveScale = amplitude.interpolate({
    inputRange: [1, 1.5],
    outputRange: [1, 1.5],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Adicionar Item</Text>

      <TextInput
        style={styles.textBox}
        value={recognizedText}
        onChangeText={setRecognizedText}
        placeholder="Fale algo ou digite aqui..."
        multiline
      />

      {/* Sugestões */}
      {suggestions.length > 0 && (
        <View style={styles.suggestionBox}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.nome}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => {
                  setRecognizedText(item.nome);
                  setSuggestions([]);
                }}
              >
                <Image
                  source={item.imagem}
                  style={styles.suggestionImage}
                  resizeMode="contain"
                />
                <Text style={styles.suggestionText}>{item.nome}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Wrapper da logo + auréola */}
      <View style={styles.logoWrapper}>
        {/* Auréola animada atrás da logo */}
        <Animated.View
          style={[
            styles.halo,
            {
              transform: [{ scale: waveScale }],
              opacity: amplitude.interpolate({
                inputRange: [1, 1.5],
                outputRange: [0.4, 0.1],
                extrapolate: "clamp",
              }),
            },
          ]}
        />

        {/* Logo fixa sobre a auréola */}
        <Image
          source={require("../../assets/imgs/logo-kitchenbrain.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <TouchableOpacity
        onPress={isRecording ? stopRecording : startRecording}
        style={[
          styles.button,
          { backgroundColor: isRecording ? "#EF4444" : "#52A267" },
        ]}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{isRecording ? "Parar" : "Gravar"}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  title: { position: "absolute", top: 60, fontSize: 22, fontWeight: "700", color: "#000" },
  textBox: {
    position: "absolute",
    top: 120,
    width: "85%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#f9f9f9",
    fontSize: 16,
    color: "#333",
    minHeight: 60,
    textAlignVertical: "top",
  },
  suggestionBox: {
    position: "absolute",
    top: 200,
    width: "85%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    maxHeight: 150,
    zIndex: 10,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  suggestionImage: {
    width: 30,
    height: 30,
    marginRight: 10,
    borderRadius: 5,
  },
  suggestionText: {
    fontSize: 16,
    color: "#333",
  },

  // Wrapper da logo + auréola
  logoWrapper: {
    width: 220,
    height: 220,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },

  // Auréola
  halo: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#52A267",
    zIndex: 0,
  },

  // Logo
  logo: {
    width: 200,
    height: 200,
    zIndex: 1,
  },

  button: { marginTop: 50, paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30 },
  buttonText: { color: "#fff", fontSize: 18 },
});
