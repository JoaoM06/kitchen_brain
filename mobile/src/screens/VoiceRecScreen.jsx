import React, { useState, useRef } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  Animated,
  Easing,
  StyleSheet,
  TextInput,
} from "react-native";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";

export default function VoiceRecScreen({ navigation }) {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const amplitude = useRef(new Animated.Value(1)).current; // escala do círculo pulsante

  const animateWave = (value) => {
    Animated.timing(amplitude, {
      toValue: value,
      duration: 120,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        alert("Permissão para usar o microfone negada!");
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

      const interval = setInterval(async () => {
        const status = await recording.getStatusAsync();
        if (status.isRecording) {
          const randomVolume = Math.random() * 0.4 + 1; // 1 a 1.4
          animateWave(randomVolume);

          // Simula transcrição gradual
          const fakeWords = ["olá", "tudo", "bem", "como", "vai", "você", "?"];
          const randomWord =
            fakeWords[Math.floor(Math.random() * fakeWords.length)];
          setRecognizedText((prev) => (prev + " " + randomWord).trim());
        } else {
          clearInterval(interval);
        }
      }, 500);
    } catch (err) {
      console.error("Erro ao iniciar gravação:", err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log("Áudio salvo em:", uri);
    } catch (err) {
      console.error("Erro ao parar gravação:", err);
    }

    setIsRecording(false);
    setRecording(null);
    animateWave(1);
  };

  const waveScale = amplitude.interpolate({
    inputRange: [1, 1.4],
    outputRange: [1, 1.4],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      {/* Título */}
      <Text style={styles.title}>Adicionar Item</Text>

      {/* Caixa de texto */}
      <TextInput
        style={styles.textBox}
        value={recognizedText}
        onChangeText={setRecognizedText}
        placeholder="Fale algo ou digite aqui..."
        multiline
      />

      {/* Área central com logo e círculo */}
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <View style={styles.logoContainer}>
          {/* Círculo pulsante */}
          <Animated.View
            style={[
              styles.pulseCircle,
              { transform: [{ scale: waveScale }] },
            ]}
          />
          {/* Logo fixa */}
          <Animated.Image
            source={require("../../assets/imgs/logo-kitchenbrain.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Botão de gravação */}
      <TouchableOpacity
        onPress={isRecording ? stopRecording : startRecording}
        style={[
          styles.button,
          { backgroundColor: isRecording ? "#ef4444" : "#52A267" },
        ]}
      >
        <Ionicons
          name={isRecording ? "mic-off" : "mic"}
          size={20}
          color="#fff"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.buttonText}>
          {isRecording ? "Parar" : "Gravar"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
  },
  textBox: {
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
    marginTop: 20,
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  pulseCircle: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 100,
    backgroundColor: "rgba(82, 162, 103, 0.25)", // cor e transparência ajustadas
  },
  logo: {
    width: 150,
    height: 150,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 200,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
  },
});
