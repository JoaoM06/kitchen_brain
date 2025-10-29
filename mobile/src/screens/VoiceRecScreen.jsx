import React, { useState, useRef } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  Animated,
  Easing,
  StyleSheet,
  TextInput,
  Image,
} from "react-native";
import { Audio } from "expo-av";

export default function VoiceRecScreen() {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const amplitude = useRef(new Animated.Value(1)).current; // começa com escala 1

  const animateWave = (value) => {
    Animated.timing(amplitude, {
      toValue: value,
      duration: 100,
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
          const randomVolume = Math.random() * 0.5 + 1; // escala mínima 1, máxima ~1.5
          animateWave(randomVolume);

          // Simula reconhecimento de voz
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
    animateWave(1); // volta à escala normal
  };

  const waveScale = amplitude.interpolate({
    inputRange: [1, 1.5],
    outputRange: [1, 1.5],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      {/* Título */}
      <Text style={styles.title}>Pesquisa por voz</Text>

      {/* Caixa de texto */}
      <TextInput
        style={styles.textBox}
        value={recognizedText}
        onChangeText={setRecognizedText}
        placeholder="Fale algo ou digite aqui..."
        multiline
      />

      {/* Logo pulsante */}
      <Animated.Image
        source={require("../../assets/imgs/logo-kitchenbrain.png")}
        style={[
          styles.logo,
          { transform: [{ scale: waveScale }] },
        ]}
        resizeMode="contain"
      />

      {/* Botão de gravação */}
      <TouchableOpacity
        onPress={isRecording ? stopRecording : startRecording}
        style={[
          styles.button,
          { backgroundColor: isRecording ? "#ef4444" : "#52A267" },
        ]}
      >
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
    justifyContent: "center",
  },
  title: {
    position: "absolute",
    top: 60,
    fontSize: 22,
    fontWeight: "700",
    color: "#000000ff",
  },
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
  logo: {
    width: 200,
    height: 200,
    marginTop: 0,
  },
  button: {
    marginTop: 50,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
  },
});
