import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert } from "react-native";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Rect } from "react-native-svg";

export default function VoiceSearchScreen() {
  const [recording, setRecording] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [levels, setLevels] = useState(Array(40).fill(0));

  // Simula waveform enquanto grava
  useEffect(() => {
    let interval;
    if (isListening) {
      interval = setInterval(() => {
        setLevels(levels.map(() => Math.random() * 80));
      }, 100);
    } else {
      setLevels(Array(40).fill(0));
    }
    return () => clearInterval(interval);
  }, [isListening]);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Permissão de microfone negada!");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec);
      setIsListening(true);
    } catch (err) {
      console.error("Erro ao iniciar gravação:", err);
    }
  };

  const stopRecording = async () => {
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setIsListening(false);

      // Aqui você envia o arquivo de áudio para sua API de Speech-to-Text
      const text = await recognizeSpeech(uri);
      setSearchQuery(text);
    } catch (err) {
      console.error("Erro ao parar gravação:", err);
    }
  };

  // Simulação de função de reconhecimento de voz
  const recognizeSpeech = async (audioUri) => {
    // Substitua por chamada real a Google Speech-to-Text ou OpenAI Whisper
    console.log("Áudio para reconhecimento:", audioUri);
    return "Exemplo de resultado de voz"; // texto simulado
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Digite ou use voz..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.audioContainer}>
        <Svg height="80" width="200" style={{ position: "absolute", bottom: -585 }}>
          {levels.map((level, i) => (
            <Rect
              key={i}
              x={i * 10}
              y={30 - level}
              width={4}
              height={level}
              fill="green"
              rx={1}
            />
          ))}
        </Svg>

        <TouchableOpacity
          onPress={isListening ? stopRecording : startRecording}
          style={styles.micButton}
        >
          <Ionicons
            name={isListening ? "mic" : "mic-off"}
            size={28}
            color="#fff"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", paddingTop: 80, backgroundColor: "#fff" },
  searchInput: {
    width: "90%",
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 40,
    fontSize: 16,
  },
  audioContainer: {
    width: 200,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  micButton: {
    position: "absolute",
    bottom: -600,
    backgroundColor: "#7b808a",
    borderRadius: 50,
    padding: 12,
  },
});
