import React, { useState, useRef } from "react";
import { View, TouchableOpacity, Text, Animated, Easing } from "react-native";
import { Audio } from "expo-av";

export default function VoiceRecScreen() {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const amplitude = useRef(new Animated.Value(0)).current;

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
      console.log("🎙️ Iniciando gravação...");

      // Permissões
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        alert("Permissão para usar o microfone negada!");
        return;
      }

      // Configuração do modo de áudio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Cria o objeto de gravação
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);

      // Simulação: atualizar amplitude de forma dinâmica
      const interval = setInterval(async () => {
        const status = await recording.getStatusAsync();
        if (status.isRecording) {
          // Valor RMS simulado (quanto maior, mais "voz")
          const randomVolume = Math.random() * 2;
          animateWave(randomVolume);
        } else {
          clearInterval(interval);
        }
      }, 200);
    } catch (err) {
      console.error("Erro ao iniciar gravação:", err);
    }
  };

  const stopRecording = async () => {
    console.log("🛑 Parando gravação...");
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
    animateWave(0);
  };

  // Animação da onda
  const waveScale = amplitude.interpolate({
    inputRange: [0, 2],
    outputRange: [1, 2.5], // aumenta conforme o volume
    extrapolate: "clamp",
  });

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0d0d0d",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Animated.View
        style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: "#4f46e5",
          transform: [{ scale: waveScale }],
          opacity: 0.8,
        }}
      />
      <TouchableOpacity
        onPress={isRecording ? stopRecording : startRecording}
        style={{
          marginTop: 50,
          backgroundColor: isRecording ? "#ef4444" : "#22c55e",
          paddingVertical: 15,
          paddingHorizontal: 30,
          borderRadius: 30,
        }}
      >
        <Text style={{ color: "white", fontSize: 18 }}>
          {isRecording ? "Parar" : "Gravar"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
