import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
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
const IS_EXPO_GO = Constants.appOwnership === "expo";
// ===================================================

// Helper para mapear status do SO -> nosso backend
const mapPerm = (status) => {
  // Expo retorna "granted" | "denied" | "undetermined"
  if (!status) return "prompt";
  if (status === "granted") return "granted";
  if (status === "undetermined") return "prompt";
  return "denied";
};

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

  // cache em memória do deviceId (evita I/O repetido)
  const deviceIdRef = useRef(null);

  const getAuthHeader = useCallback(async () => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // fetch com timeout (evita “travadas” se a API demorar)
  const fetchJSON = useCallback(
    async (path, opts = {}, timeoutMs = 10000) => {
      const headers = {
        "Content-Type": "application/json",
        ...(await getAuthHeader()),
        ...(opts.headers || {}),
      };

      const ctrl = new AbortController();
      const id = setTimeout(() => ctrl.abort(new Error("timeout")), timeoutMs);

      try {
        const res = await fetch(`${BASE_URL}${path}`, { ...opts, headers, signal: ctrl.signal });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`${res.status} ${res.statusText}: ${text}`);
        }
        return res.status === 204 ? null : res.json();
      } finally {
        clearTimeout(id);
      }
    },
    [getAuthHeader]
  );

  // registra device se necessário (sem buscar push token aqui)
  const registerDeviceIfNeeded = useCallback(async () => {
    if (deviceIdRef.current) return deviceIdRef.current;

    let devId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (devId) {
      deviceIdRef.current = devId;
      return devId;
    }

    const platform = Platform.OS;
    const model = Device.modelName ?? null;
    const os_version = String(Device.osVersion ?? "");
    const app_version =
      Constants?.expoConfig?.version ?? Constants?.nativeAppVersion ?? null;

    const body = { platform, model, os_version, app_version };

    const dev = await fetchJSON("/me/devices", {
      method: "POST",
      body: JSON.stringify(body),
    });

    devId = dev?.id ?? null;
    if (devId) {
      deviceIdRef.current = devId;
      await AsyncStorage.setItem(DEVICE_ID_KEY, devId);
    }
    return devId;
  }, [fetchJSON]);

  // snapshot das permissões; se "kind" for passada, foca só nela
  const snapshotAndSendDevicePermissions = useCallback(
    async (deviceId, kind) => {
      if (!deviceId) return null;

      const payload = {};
      const wants = kind ? [kind] : ["location", "notifications", "camera", "microphone"];

      if (wants.includes("location")) {
        const loc = await Location.getForegroundPermissionsAsync().catch(() => null);
        payload.p_location = mapPerm(loc?.status);
      }
      if (wants.includes("notifications")) {
        if (IS_EXPO_GO) {
          payload.p_notifications = "unsupported";
        } else {
          const noti = await Notifications.getPermissionsAsync().catch(() => null);
          payload.p_notifications = mapPerm(noti?.status);
        }
      }
      if (wants.includes("camera")) {
        const cam = await Camera.getCameraPermissionsAsync().catch(() => null);
        payload.p_camera = mapPerm(cam?.status);
      }
      if (wants.includes("microphone")) {
        const mic = await Audio.getPermissionsAsync().catch(() => null);
        payload.p_microphone = mapPerm(mic?.status);
      }

      await fetchJSON(`/me/devices/${deviceId}/permissions`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      return payload;
    },
    [fetchJSON]
  );

  // carrega settings + registra device em paralelo e libera a UI; snapshot em background
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, devId] = await Promise.all([
        fetchJSON("/me/settings"),
        registerDeviceIfNeeded(),
      ]);
      setConsent((old) => ({ ...old, ...s }));
      setLoading(false); // libera a tela já

      // snapshot sem bloquear a UI
      snapshotAndSendDevicePermissions(devId)
        .then((p) => p && setPerm((old) => ({ ...old, ...p })))
        .catch(() => {});
    } catch (e) {
      setLoading(false);
      Alert.alert("Erro", String(e?.message || e));
    }
  }, [fetchJSON, registerDeviceIfNeeded, snapshotAndSendDevicePermissions]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const updateConsent = useCallback(
    async (patch) => {
      // PATCH /me/settings
      const prev = consent;
      const optimistic = { ...prev, ...patch };
      setConsent(optimistic);
      try {
        const s = await fetchJSON("/me/settings", {
          method: "PATCH",
          body: JSON.stringify(patch),
        });
        setConsent((old) => ({ ...old, ...s }));
      } catch (e) {
        // rollback se falhar
        setConsent(prev);
        Alert.alert("Erro", String(e?.message || e));
      }
    },
    [consent, fetchJSON]
  );

  // pede a permissão específica e sincroniza sem travar
  const requestAndSync = useCallback(
    async (kind) => {
      try {
        const devId = deviceIdRef.current || (await registerDeviceIfNeeded());

        if (kind === "location") {
          const { status } = await Location.requestForegroundPermissionsAsync();
          setPerm((p) => ({ ...p, p_location: mapPerm(status) })); // UI otimista
          snapshotAndSendDevicePermissions(devId, "location");     // sem await
          if (status !== "granted") Alert.alert("Localização", "Permissão negada pelo sistema.");
        }

        if (kind === "notifications") {
          if (IS_EXPO_GO) {
            Alert.alert(
              "Notificações",
              "O Expo Go não oferece notificações push. Gere um build de desenvolvimento para ativar este recurso."
            );
            setPerm((p) => ({ ...p, p_notifications: "unsupported" }));
            snapshotAndSendDevicePermissions(devId, "notifications");
            return;
          }

          const { status } = await Notifications.requestPermissionsAsync();
          setPerm((p) => ({ ...p, p_notifications: mapPerm(status) }));
          if (status === "granted") {
            try {
              const projId =
                Constants?.expoConfig?.extra?.eas?.projectId ||
                Constants?.easConfig?.projectId;
              const tokenResp = await Notifications.getExpoPushTokenAsync(
                projId ? { projectId: projId } : {}
              );
              await fetchJSON(`/me/devices/${devId}/push-token`, {
                method: "PATCH",
                body: JSON.stringify({ push_token: tokenResp?.data ?? null }),
              });
            } catch {}
          }
          snapshotAndSendDevicePermissions(devId, "notifications"); // sem await
          if (status !== "granted") Alert.alert("Notificações", "Permissão negada pelo sistema.");
        }

        if (kind === "camera") {
          const { status } = await Camera.requestCameraPermissionsAsync();
          setPerm((p) => ({ ...p, p_camera: mapPerm(status) }));
          snapshotAndSendDevicePermissions(devId, "camera"); // sem await
          if (status !== "granted") Alert.alert("Câmera", "Permissão negada pelo sistema.");
        }

        if (kind === "microphone") {
          const { status } = await Audio.requestPermissionsAsync();
          setPerm((p) => ({ ...p, p_microphone: mapPerm(status) }));
          snapshotAndSendDevicePermissions(devId, "microphone"); // sem await
          if (status !== "granted") Alert.alert("Microfone", "Permissão negada pelo sistema.");
        }
      } catch (e) {
        Alert.alert("Erro de permissão", String(e?.message || e));
      }
    },
    [registerDeviceIfNeeded, snapshotAndSendDevicePermissions, fetchJSON]
  );

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
        desc: IS_EXPO_GO
          ? "Disponível apenas em builds de desenvolvimento/client próprio."
          : "Permite ao app enviar alertas de ofertas e itens no estoque.",
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
        desc: "Permite acesso à câmera para escanear itens e notas.",
        icon: <Ionicons name="camera-outline" size={28} color="black" />,
        permKey: "p_camera",
        onRequest: () => requestAndSync("camera"),
      },
      {
        key: "allow_microphone",
        title: "Microfone",
        desc: "Permite acesso ao microfone para pesquisa por voz.",
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
        <Text style={{ marginTop: 10 }}>Carregando permissões…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Permissões</Text>

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
            <Switch value={enabled} onValueChange={toggle} disabled={row.key === "allow_notifications" && IS_EXPO_GO} />
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
