import React, { useState, useRef } from "react";
import {
  View, TouchableOpacity, Text, Animated, Easing,
  StyleSheet, TextInput, ActivityIndicator, Alert, Image,
} from "react-native";
import { Audio } from "expo-av";
import { transcribeAudio, parseText, matchItems } from "../api/voice";

export default function VoiceRecScreen({ navigation }) {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const amplitude = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);

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
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert("Permissão negada", "Ative o microfone nas configurações do dispositivo.");
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

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

  const stopRecording = async () => {
    if (!recording) return;
    try {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      animateWave(1);

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      setIsRecording(false);
      setRecording(null);
      if (!uri) return;

      setLoading(true);
      const { text } = await transcribeAudio({ uri, language: "pt" });
      setRecognizedText(text || "");
    } catch (err) {
      console.error("Erro ao transcrever:", err);
      Alert.alert("Falha na transcrição", "Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const processAndGo = async () => {
    const raw = recognizedText.trim();
    if (!raw) {
      Alert.alert("Sem texto", "Grave ou digite algo antes de confirmar.");
      return;
    }
    try {
      setProcessing(true);
      const structured = await parseText({ text: raw });
      const matched    = await matchItems({ items: structured });
      navigation.replace("ConfirmItems", { items: matched });
    } catch (err) {
      console.log("Process error:", err?.response?.data || err.message);
      Alert.alert("Falha", "Não foi possível analisar os itens.");
    } finally {
      setProcessing(false);
    }
  };

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

      <Animated.Image
        source={require("../../assets/imgs/logo-kitchenbrain.png")}
        style={[styles.logo, { transform: [{ scale: waveScale }] }]}
        resizeMode="contain"
      />

      <TouchableOpacity
        onPress={isRecording ? stopRecording : startRecording}
        style={[styles.button, { backgroundColor: isRecording ? "#EF4444" : "#52A267" }]}
        disabled={loading || processing}
      >
        {loading ? <ActivityIndicator color="#fff" /> :
          <Text style={styles.buttonText}>{isRecording ? "Parar" : "Gravar"}</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={processAndGo}
        style={[styles.button, { backgroundColor: "#52A267", marginTop: 12, opacity: recognizedText ? 1 : 0.5 }]}
        disabled={!recognizedText || loading || processing}
      >
        {processing ? <ActivityIndicator color="#fff" /> :
          <Text style={styles.buttonText}>Confirmar</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  title: { position: "absolute", top: 60, fontSize: 22, fontWeight: "700", color: "#000" },
  textBox: {
    position: "absolute", top: 120, width: "85%",
    borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 10,
    backgroundColor: "#f9f9f9", fontSize: 16, color: "#333",
    minHeight: 60, textAlignVertical: "top",
  },
  logo: { width: 200, height: 200, marginTop: 0 },
  button: { marginTop: 50, paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30 },
  buttonText: { color: "#fff", fontSize: 18 },
});
