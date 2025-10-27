import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { Camera } from "expo-camera";
import { Audio } from "expo-av";
import * as Device from "expo-device";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../api/client";

// ====== Ajuste estes valores conforme seu app ======
const AUTH_TOKEN_KEY = "auth_token";         // onde você salva o JWT
const DEVICE_ID_KEY  = "device_id";          // onde guardamos o id do device registrado no backend
// ===================================================

// Helper para mapear status do SO -> nosso backend
const mapPerm = (status) => {
  // Expo retorna "granted" | "denied" | "undetermined" (ou "prompt" em algumas APIs)
  if (!status) return "prompt";
  if (status === "granted") return "granted";
  if (status === "undetermined") return "prompt";
  return "denied";
};

async function getAuthHeader() {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJSON(path, opts = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(await getAuthHeader()),
    ...(opts.headers || {}),
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...opts, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.status === 204 ? null : res.json();
}

async function registerDeviceIfNeeded() {
  // tenta recuperar device_id salvo
  let devId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (devId) return devId;

  // Coletar infos do aparelho
  const platform = Platform.OS;
  const model = Device.modelName ?? null;
  const os_version = String(Device.osVersion ?? "");
  const app_version =
    Constants?.expoConfig?.version ??
    Constants?.nativeAppVersion ??
    null;

  // Se já houver permissão de notifications, pega token agora
  let push_token = null;
  const notif = await Notifications.getPermissionsAsync();
  if (notif?.status === "granted") {
    try {
      // projectId é recomendado; se não tiver, o Expo tenta inferir
      const projId =
        Constants?.expoConfig?.extra?.eas?.projectId ||
        Constants?.easConfig?.projectId;
      const tokenResp = await Notifications.getExpoPushTokenAsync(
        projId ? { projectId: projId } : {}
      );
      push_token = tokenResp?.data ?? null;
    } catch (e) {
      // segue sem push token
    }
  }

  const body = {
    platform,
    model,
    os_version,
    app_version,
    push_token,
  };

  const dev = await fetchJSON("/me/devices", {
    method: "POST",
    body: JSON.stringify(body),
  });

  devId = dev?.id;
  if (devId) {
    await AsyncStorage.setItem(DEVICE_ID_KEY, devId);
  }
  return devId;
}

async function snapshotAndSendDevicePermissions(deviceId) {
  if (!deviceId) return;

  const loc = await Location.getForegroundPermissionsAsync().catch(() => null);
  const cam = await Camera.getCameraPermissionsAsync().catch(() => null);
  const mic = await Audio.getPermissionsAsync().catch(() => null);
  const noti = await Notifications.getPermissionsAsync().catch(() => null);

  const payload = {
    p_location: mapPerm(loc?.status),
    p_camera: mapPerm(cam?.status),
    p_microphone: mapPerm(mic?.status),
    p_notifications: mapPerm(noti?.status),
  };

  await fetchJSON(`/me/devices/${deviceId}/permissions`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  return payload;
}

export default function Configs() {
  const [loading, setLoading] = useState(true);

  // consentimentos (LGPD) do usuário — /me/settings
  const [consent, setConsent] = useState({
    allow_location: false,
    allow_notifications: false,
    allow_memory: false,
    allow_camera: false,
    allow_microphone: false,
  });

  // snapshot do SO (status real das permissões do aparelho)
  const [perm, setPerm] = useState({
    p_location: "prompt",
    p_notifications: "prompt",
    p_camera: "prompt",
    p_microphone: "prompt",
  });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      // 1) Carrega settings do usuário
      const s = await fetchJSON("/me/settings");
      setConsent((old) => ({ ...old, ...s }));

      // 2) Garante device registrado
      const deviceId = await registerDeviceIfNeeded();

      // 3) Tira snapshot das permissões do SO e envia p/ backend
      const p = await snapshotAndSendDevicePermissions(deviceId);
      if (p) setPerm(p);
    } catch (e) {
      Alert.alert("Erro", String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const updateConsent = async (patch) => {
    // PATCH /me/settings
    const newState = { ...consent, ...patch };
    setConsent(newState);
    try {
      const payload = {};
      for (const k of Object.keys(patch)) payload[k] = patch[k];
      const s = await fetchJSON("/me/settings", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setConsent((old) => ({ ...old, ...s }));
    } catch (e) {
      // rollback se falhar
      setConsent(consent);
      Alert.alert("Erro", String(e?.message || e));
    }
  };

  const requestAndSync = async (kind) => {
    // Solicita permissão ao SO e sincroniza o snapshot para o backend
    try {
      const deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);

      if (kind === "location") {
        const { status } = await Location.requestForegroundPermissionsAsync();
        const up = await snapshotAndSendDevicePermissions(deviceId);
        if (up) setPerm((p) => ({ ...p, ...up }));
        if (status !== "granted") {
          Alert.alert("Localização", "Permissão negada pelo sistema.");
        }
      }

      if (kind === "notifications") {
        const { status } = await Notifications.requestPermissionsAsync();
        // se concedido, tente obter o Expo Push Token e re-registrar device (atualiza token)
        if (status === "granted") {
          try {
            const projId =
              Constants?.expoConfig?.extra?.eas?.projectId ||
              Constants?.easConfig?.projectId;
            const tokenResp = await Notifications.getExpoPushTokenAsync(
              projId ? { projectId: projId } : {}
            );
            // estratégia simples: descartar device_id salvo e registrar de novo com token
            await AsyncStorage.removeItem(DEVICE_ID_KEY);
            await registerDeviceIfNeeded();
          } catch {}
        }
        const up = await snapshotAndSendDevicePermissions(deviceId);
        if (up) setPerm((p) => ({ ...p, ...up }));
        if (status !== "granted") {
          Alert.alert("Notificações", "Permissão negada pelo sistema.");
        }
      }

      if (kind === "camera") {
        const { status } = await Camera.requestCameraPermissionsAsync();
        const up = await snapshotAndSendDevicePermissions(deviceId);
        if (up) setPerm((p) => ({ ...p, ...up }));
        if (status !== "granted") {
          Alert.alert("Câmera", "Permissão negada pelo sistema.");
        }
      }

      if (kind === "microphone") {
        const { status } = await Audio.requestPermissionsAsync();
        const up = await snapshotAndSendDevicePermissions(deviceId);
        if (up) setPerm((p) => ({ ...p, ...up }));
        if (status !== "granted") {
          Alert.alert("Microfone", "Permissão negada pelo sistema.");
        }
      }
    } catch (e) {
      Alert.alert("Erro de permissão", String(e?.message || e));
    }
  };

  const rows = useMemo(
    () => [
      {
        key: "allow_location",
        title: "Localização",
        desc:
          "Compartilha a localização para sugerir e filtrar os melhores preços e mercados por perto.",
        icon: <Ionicons name="location-outline" size={28} color="black" />,
        permKey: "p_location",
        onRequest: () => requestAndSync("location"),
      },
      {
        key: "allow_notifications",
        title: "Notificações",
        desc:
          "Permite ao app enviar alertas de ofertas e itens no estoque.",
        icon: <Ionicons name="notifications-outline" size={28} color="black" />,
        permKey: "p_notifications",
        onRequest: () => requestAndSync("notifications"),
      },
      {
        key: "allow_memory",
        title: "Memória",
        desc:
          "Permite ao app guardar dados do usuário em memória persistente (preferências locais).",
        icon: <MaterialIcons name="folder-open" size={28} color="black" />,
        permKey: null, // não há permissão de SO
        onRequest: null,
      },
      {
        key: "allow_camera",
        title: "Câmera",
        desc:
          "Permite acesso à câmera para escanear itens e notas.",
        icon: <Ionicons name="camera-outline" size={28} color="black" />,
        permKey: "p_camera",
        onRequest: () => requestAndSync("camera"),
      },
      {
        key: "allow_microphone",
        title: "Microfone",
        desc:
          "Permite acesso ao microfone para pesquisa por voz.",
        icon: <FontAwesome5 name="microphone" size={24} color="black" />,
        permKey: "p_microphone",
        onRequest: () => requestAndSync("microphone"),
      },
    ],
    [requestAndSync]
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Carregando configurações…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Configurações</Text>

      {rows.map((row) => {
        const enabled = !!consent[row.key];
        const permStatus = row.permKey ? perm[row.permKey] : null;

        const toggle = async (value) => {
          // 1) Atualiza consentimento (LGPD)
          await updateConsent({ [row.key]: value });

          // 2) Se é permissão do SO e usuário ligou, solicita de verdade
          if (value && row.onRequest) {
            await row.onRequest();
          }
        };

        return (
          <View key={row.key} style={styles.row}>
            <View style={styles.icon}>{row.icon}</View>
            <View style={styles.texts}>
              <Text style={styles.title}>{row.title}</Text>
              <Text style={styles.desc}>{row.desc}</Text>
              {permStatus && (
                <Text style={styles.perm}>
                  Status do sistema: <Text style={styles.permBold}>{permStatus}</Text>
                </Text>
              )}
            </View>
            <Switch value={enabled} onValueChange={toggle} />
          </View>
        );
      })}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 50, paddingHorizontal: 20 },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 16 },
  icon: { width: 36, alignItems: "center", marginRight: 12 },
  texts: { flex: 1 },
  title: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  desc: { color: "#333", opacity: 0.75 },
  perm: { marginTop: 6, fontSize: 12, color: "#666" },
  permBold: { fontWeight: "700", color: "#111" },
});
