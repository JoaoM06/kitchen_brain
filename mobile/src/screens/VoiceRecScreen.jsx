import React, { useState, useEffect } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Rect } from "react-native-svg";

export default function VoiceSearchScreen() {
  const [recording, setRecording] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [levels, setLevels] = useState(Array(40).fill(0));

  // Atualiza a onda conforme a voz
  useEffect(() => {
    let interval;
    if (isListening && recording) {
      interval = setInterval(async () => {
        const status = await recording.getStatusAsync();
        const amplitude = status.metering || 0;
        const scaled = Math.max(0, amplitude * 2);
        setLevels(Array(40).fill(scaled));
      }, 100);
    } else {
      setLevels(Array(40).fill(0));
    }
    return () => clearInterval(interval);
  }, [isListening, recording]);

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

      const recordingOptions = {
        android: {
          extension: ".m4a",
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          isMeteringEnabled: true,
        },
        ios: {
          extension: ".caf",
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
          isMeteringEnabled: true,
        },
      };

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(recordingOptions);
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

      const text = await recognizeSpeech(uri); // envia para backend/Whisper
      setSearchQuery(text);
    } catch (err) {
      console.error("Erro ao parar gravação:", err);
    }
  };

  // Função de integração com API real de Speech-to-Text
  const recognizeSpeech = async (audioUri) => {
    try {
      const formData = new FormData();
      formData.append("audio", {
        uri: audioUri,
        type: "audio/x-wav",
        name: "recording.wav",
      });

      const response = await fetch("http://192.168.68.104:3000/speech-to-text", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      return data.text || "";
    } catch (err) {
      console.error("Erro ao reconhecer fala:", err);
      return "";
    }
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
        <Svg height="80" width="200">
          {levels.map((level, i) => (
            <Rect
              key={i}
              x={i * 5}
              y={80 - level}
              width={3}
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
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 80,
    backgroundColor: "#fff",
  },
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
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  micButton: {
    position: "absolute",
    bottom: -20,
    backgroundColor: "#7b808a",
    borderRadius: 50,
    padding: 12,
  },
});
