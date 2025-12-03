import React, { useCallback, useState } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet, Alert, Platform, Modal, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import FooterNav from "../components/FooterNav";
import SafeScreen from "../components/SafeScreen";
import { colors } from "../theme/colors";
import { getSavedMenus, removeSavedMenu, updateSavedMenu } from "../storage/savedMenus";
import { HUB_POSTS } from "../data/recipeHub";
import { getCommunityPosts, getHubReactions } from "../storage/recipeHub";

const PROFILE_IMAGE_KEY = 'profile_image_uri';
const PROFILE_NAME_KEY = 'profile_name';
const PROFILE_BIO_KEY = 'profile_bio';
const DEFAULT_PROFILE_NAME = "Thaís Paiva";
const DEFAULT_PROFILE_BIO = "Gosto de tudo que tenha queijo com tomate\nPrefiro salgado a doce\nPreguiça de usar o forno";

export default function ProfileScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Receitas');
  const [savedCardapios, setSavedCardapios] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [profileName, setProfileName] = useState(DEFAULT_PROFILE_NAME);
  const [profileBio, setProfileBio] = useState(DEFAULT_PROFILE_BIO);
  const [profileEditorVisible, setProfileEditorVisible] = useState(false);
  const [profileDraft, setProfileDraft] = useState({ name: DEFAULT_PROFILE_NAME, bio: DEFAULT_PROFILE_BIO });
  const [menuEditor, setMenuEditor] = useState({ visible: false, menuId: null, title: "" });
  const [communityPosts, setCommunityPosts] = useState([]);
  const [savedHubRecipes, setSavedHubRecipes] = useState([]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      (async () => {
        try {
          const [stored, profileValues, hubCommunity, hubReactions] = await Promise.all([
            getSavedMenus(),
            AsyncStorage.multiGet([PROFILE_IMAGE_KEY, PROFILE_NAME_KEY, PROFILE_BIO_KEY]),
            getCommunityPosts(),
            getHubReactions(),
          ]);
          const mapValues = Object.fromEntries(profileValues || []);
          if (isActive) {
            setSavedCardapios(stored);
            if (mapValues[PROFILE_IMAGE_KEY]) setProfileImage(mapValues[PROFILE_IMAGE_KEY]);
            setProfileName(mapValues[PROFILE_NAME_KEY] || DEFAULT_PROFILE_NAME);
            setProfileBio(mapValues[PROFILE_BIO_KEY] || DEFAULT_PROFILE_BIO);
            setCommunityPosts(hubCommunity);
            const catalog = [...hubCommunity, ...HUB_POSTS];
            const saved = (hubReactions.savedIds || [])
              .map((id) => catalog.find((post) => post.id === id))
              .filter(Boolean);
            setSavedHubRecipes(saved);
          }
        } catch (err) {
          console.warn("Erro ao carregar dados do perfil", err);
        }
      })();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const handleChangeProfileImage = async () => {
    // Para web, usar input HTML nativo
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = async (event) => {
            const uri = event.target.result;
            setProfileImage(uri);
            await AsyncStorage.setItem(PROFILE_IMAGE_KEY, uri);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
      return;
    }

    // Para mobile
    Alert.alert(
      "Alterar foto de perfil",
      "Escolha uma opção",
      [
        {
          text: "Tirar Foto",
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permissão negada', 'Precisamos de permissão para acessar a câmera');
              return;
            }

            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.5,
            });

            if (!result.canceled && result.assets[0]) {
              const uri = result.assets[0].uri;
              setProfileImage(uri);
              await AsyncStorage.setItem(PROFILE_IMAGE_KEY, uri);
            }
          }
        },
        {
          text: "Escolher da Galeria",
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permissão negada', 'Precisamos de permissão para acessar a galeria');
              return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.5,
            });

            if (!result.canceled && result.assets[0]) {
              const uri = result.assets[0].uri;
              setProfileImage(uri);
              await AsyncStorage.setItem(PROFILE_IMAGE_KEY, uri);
            }
          }
        },
        {
          text: "Cancelar",
          style: "cancel"
        }
      ]
    );
  };

  const openProfileEditor = () => {
    setProfileDraft({ name: profileName, bio: profileBio });
    setProfileEditorVisible(true);
  };

  const handleSaveProfileInfo = async () => {
    const trimmedName = profileDraft.name.trim() || DEFAULT_PROFILE_NAME;
    const trimmedBio = profileDraft.bio.trim() || DEFAULT_PROFILE_BIO;
    setProfileName(trimmedName);
    setProfileBio(trimmedBio);
    setProfileEditorVisible(false);
    try {
      await AsyncStorage.multiSet([
        [PROFILE_NAME_KEY, trimmedName],
        [PROFILE_BIO_KEY, trimmedBio],
      ]);
    } catch (err) {
      console.warn("Erro ao salvar perfil", err);
    }
  };

  const handleOpenMenuRename = (menu) => {
    setMenuEditor({
      visible: true,
      menuId: menu.id,
      title: menu.title || "",
    });
  };

  const handleSaveMenuTitle = async () => {
    const trimmed = menuEditor.title.trim();
    if (!trimmed) {
      Alert.alert("Nome obrigatório", "Digite um nome para o cardápio.");
      return;
    }
    try {
      const updated = await updateSavedMenu(menuEditor.menuId, { title: trimmed });
      setSavedCardapios(updated);
    } catch (err) {
      Alert.alert("Erro", "Não foi possível renomear este cardápio.");
    } finally {
      setMenuEditor({ visible: false, menuId: null, title: "" });
    }
  };

  const handleDeleteMenu = (menu) => {
    Alert.alert(
      "Remover cardápio",
      `Deseja remover "${menu.title}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              const updated = await removeSavedMenu(menu.id);
              setSavedCardapios(updated);
            } catch (err) {
              Alert.alert("Erro", "Não foi possível remover este cardápio.");
            }
          },
        },
      ]
    );
  };

  const formatDate = (value) => {
    if (!value) return "Data não informada";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Data não informada";
    return parsed.toLocaleDateString("pt-BR");
  };

  const getDiasCount = (menu) => {
    const dias = menu?.data?.menu?.dias || menu?.data?.dias;
    return Array.isArray(dias) ? dias.length : 0;
  };

  const getPostMedia = (item) => {
    const type = item.mediaType || (item.videoUri ? "video" : "image");
    const uri = item.mediaUri || (type === "video" ? item.videoUri : null) || item.image || null;
    return { type, uri };
  };

  const renderReceita = ({ item }) => {
    const media = getPostMedia(item);
    const source = media.uri ? { uri: media.uri } : require("../../assets/imgs/chef.png");
    return (
      <View style={styles.item}>
        <View style={styles.thumbWrap}>
          <Image source={source} style={styles.itemImage} />
          {media.type === "video" && (
            <View style={styles.videoBadge}>
              <Ionicons name="videocam" size={12} color="#fff" />
              <Text style={styles.videoBadgeText}>Vídeo</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.itemTitulo}>{item.title}</Text>
          {!!item.prepTime && <Text style={styles.itemSub}>{`Tempo: ${item.prepTime}`}</Text>}
          {!!item.difficulty && <Text style={styles.itemSub}>{item.difficulty}</Text>}
          {!!item.author?.name && (
            <Text style={styles.itemSub}>{`Por ${item.author.name}`}</Text>
          )}
        </View>
      </View>
    );
  };

  const renderPostagem = ({ item }) => {
    const media = getPostMedia(item);
    const source = media.uri ? { uri: media.uri } : require("../../assets/imgs/chef.png");
    return (
    <View style={styles.item}>
      <View style={styles.thumbWrap}>
        <Image source={source} style={styles.postImage} />
        {media.type === "video" && (
          <View style={styles.videoBadge}>
            <Ionicons name="videocam" size={12} color="#fff" />
            <Text style={styles.videoBadgeText}>Vídeo</Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.postTitulo}>{item.title}</Text>
        <Text style={styles.postDescricao} numberOfLines={3}>
          {item.description}
        </Text>
        <Text style={styles.postMeta}>
          {new Date(item.createdAt || Date.now()).toLocaleDateString("pt-BR")}
        </Text>
      </View>
    </View>
    );
  };

  const renderCardapio = ({ item }) => (
    <TouchableOpacity
      style={styles.cardapioItem}
      onPress={() => navigation.navigate("MenuView", { menu: item })}
      activeOpacity={0.7}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.cardapioTitulo}>{item.title}</Text>
        {!!item.dateRange && <Text style={styles.cardapioRange}>{item.dateRange}</Text>}
        <Text style={styles.cardapioMeta}>
          {formatDate(item.savedAt || item.generatedAt)} • {getDiasCount(item)} dias
        </Text>
        {!!item?.data?.constraints?.diet?.length && (
          <Text style={styles.cardapioDiet}>{item.data.constraints.diet.join(", ")}</Text>
        )}
        <View style={styles.cardapioActions}>
          <TouchableOpacity
            style={styles.cardapioActionButton}
            onPress={(e) => {
              e.stopPropagation?.();
              handleOpenMenuRename(item);
            }}
          >
            <Text style={styles.cardapioActionText}>Renomear</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cardapioActionButton, styles.cardapioActionDanger]}
            onPress={(e) => {
              e.stopPropagation?.();
              handleDeleteMenu(item);
            }}
          >
            <Text style={[styles.cardapioActionText, styles.cardapioActionDangerText]}>Remover</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.cardapioChevron}>
        <Text style={styles.cardapioChevronText}>›</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeScreen> 
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={openProfileEditor}>
          <Text style={styles.headerButton}>Editar</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>Perfil</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Config")}>
          <Text style={styles.headerButton}>Config</Text>
        </TouchableOpacity>
      </View>

      {/* PERFIL */}
      <View style={styles.profile}>
        <TouchableOpacity onPress={handleChangeProfileImage} activeOpacity={0.8}>
          <Image
            source={{
              uri: profileImage || 'https://marketplace.canva.com/gJly0/MAGDkMgJly0/1/tl/canva-user-profile-icon-vector.-avatar-or-person-icon.-profile-picture%2C-portrait-symbol.-MAGDkMgJly0.png',
            }}
            style={styles.avatar}
          />
          <View style={styles.cameraIcon}>
            <Text style={styles.cameraIconText}>📷</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.name}>{profileName}</Text>
        <Text style={styles.bio}>{profileBio}</Text>
      </View>

      {/* TABS */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Receitas' && styles.activeTab]}
          onPress={() => setActiveTab('Receitas')}
        >
          <Text
            style={[styles.tabText, activeTab === 'Receitas' && styles.activeTabText]}
          >
            Receitas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Postagens' && styles.activeTab]}
          onPress={() => setActiveTab('Postagens')}
        >
          <Text
            style={[styles.tabText, activeTab === 'Postagens' && styles.activeTabText]}
          >
            Postagens
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Cardápios' && styles.activeTab]}
          onPress={() => setActiveTab('Cardápios')}
        >
          <Text
            style={[styles.tabText, activeTab === 'Cardápios' && styles.activeTabText]}
          >
            Cardápios
          </Text>
        </TouchableOpacity>
      </View>

      {/* CONTEÚDO DINÂMICO */}
      {activeTab === 'Receitas' && (
        <FlatList
          data={savedHubRecipes}
          keyExtractor={(item) => item.id}
          renderItem={renderReceita}
          style={{ width: '100%' }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 90, flexGrow: 1 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Nenhuma receita salva</Text>
              <Text style={styles.emptySubtitle}>
                Salve receitas no Hub para encontrá-las aqui rapidamente.
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate("RecipeHub")} style={styles.linkButton}>
                <Text style={styles.linkButtonText}>Ir para o Hub</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
      {activeTab === 'Postagens' && (
        <FlatList
          data={communityPosts}
          keyExtractor={(item) => item.id}
          renderItem={renderPostagem}
          style={{ width: '100%' }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 90, flexGrow: 1 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Você ainda não publicou</Text>
              <Text style={styles.emptySubtitle}>
                Compartilhe sua primeira receita para mostrar ao mundo.
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate("RecipeHubCreate")} style={styles.linkButton}>
                <Text style={styles.linkButtonText}>Publicar agora</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
      {activeTab === 'Cardápios' && (
        <FlatList
          data={savedCardapios}
          keyExtractor={(item) => item.id}
          renderItem={renderCardapio}
          style={{ width: '100%' }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 90 }}
          ListEmptyComponent={() => (
            <View style={styles.emptyCardapioBox}>
              <Text style={styles.emptyCardapioTitle}>Nenhum cardápio salvo ainda</Text>
              <Text style={styles.emptyCardapioText}>
                Gere um cardápio com o CardapioBot e toque em "Salvar no perfil".
              </Text>
            </View>
          )}
        />
      )}

      {/* NAVBAR */}
      <FooterNav active="Profile" onNavigate={navigation.replace} />

      <Modal visible={profileEditorVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Editar perfil</Text>
            <Text style={styles.modalLabel}>Nome</Text>
            <TextInput
              style={styles.modalInput}
              value={profileDraft.name}
              onChangeText={(text) => setProfileDraft((prev) => ({ ...prev, name: text }))}
              placeholder="Seu nome"
            />
            <Text style={styles.modalLabel}>Bio</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              value={profileDraft.bio}
              onChangeText={(text) => setProfileDraft((prev) => ({ ...prev, bio: text }))}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setProfileEditorVisible(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={handleSaveProfileInfo}>
                <Text style={styles.modalButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={menuEditor.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Renomear cardápio</Text>
            <TextInput
              style={styles.modalInput}
              value={menuEditor.title}
              onChangeText={(text) => setMenuEditor((prev) => ({ ...prev, title: text }))}
              placeholder="Nome do cardápio"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setMenuEditor({ visible: false, menuId: null, title: "" })}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={handleSaveMenuTitle}>
                <Text style={styles.modalButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center' },

  header: {
    width: '100%',
    height: 80,
    backgroundColor: '#69a66a',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerText: { color: '#fff', fontSize: 22, fontWeight: 'bold' , marginBottom: 10},
  headerButton: { color: '#fff', fontSize: 14, marginLeft: 5 },

  profile: { alignItems: 'center', marginTop: -20, paddingHorizontal: 20 ,marginBottom: 10},
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
    marginTop: -2,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#69a66a',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  cameraIconText: {
    fontSize: 16,
  },
  name: { fontSize: 22, fontWeight: 'bold', marginTop: 10 },
  bio: { textAlign: 'center', color: '#999', marginTop: 5 },

  tabs: {
    flexDirection: 'row',
    marginVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    overflow: 'hidden',
    width: '90%',
    alignSelf: 'center',
  },
  tab: { flex: 1, padding: 10, alignItems: 'center', backgroundColor: '#fff' },
  activeTab: { backgroundColor: '#e6f2e6' },
  tabText: { color: '#999' },
  activeTabText: { color: '#69a66a', fontWeight: 'bold' },

  item: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  thumbWrap: {
    position: 'relative',
  },
  itemImage: { width: 55, height: 55, borderRadius: 8, backgroundColor: '#ddd' },
  itemTitulo: { fontWeight: 'bold', fontSize: 16 },
  itemSub: { color: '#666', fontSize: 12 },
  bookmark: { width: 20, height: 20, backgroundColor: '#69a66a', borderRadius: 4 },

  postItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  postImage: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#ddd' },
  postTitulo: { fontWeight: 'bold', fontSize: 16 },
  postDescricao: { color: '#666', fontSize: 13, marginTop: 3 },
  postMeta: { color: '#9CA3AF', fontSize: 12, marginTop: 4 },

  cardapioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  cardapioTitulo: { fontWeight: 'bold', fontSize: 16, color: '#162a1b' },
  cardapioRange: { color: '#4b7351', marginTop: 4 },
  cardapioMeta: { color: '#666', fontSize: 12, marginTop: 4 },
  cardapioDiet: { color: '#69a66a', fontSize: 12, marginTop: 2 },
  cardapioChevron: {
    marginLeft: 12,
    paddingLeft: 8,
  },
  cardapioChevronText: {
    fontSize: 28,
    color: '#69a66a',
    fontWeight: '300',
  },
  cardapioActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  cardapioActionButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#e8f5e9',
  },
  cardapioActionText: { color: '#166534', fontWeight: '600' },
  cardapioActionDanger: { backgroundColor: '#fee2e2' },
  cardapioActionDangerText: { color: '#b91c1c' },
  emptyCardapioBox: {
    paddingHorizontal: 20,
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyCardapioTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  emptyCardapioText: { textAlign: 'center', color: '#666', marginTop: 6 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 30,
  },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 6 },
  emptySubtitle: { color: '#6B7280', textAlign: 'center', marginBottom: 12 },
  linkButton: {
    backgroundColor: '#69a66a',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
  },
  linkButtonText: { color: '#fff', fontWeight: '600' },
  videoBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  videoBadgeText: {
    color: '#fff',
    fontSize: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    gap: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  modalLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 4 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111',
  },
  modalTextArea: { minHeight: 90 },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  modalButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  modalButtonText: { color: '#fff', fontWeight: '700' },
  modalButtonSecondary: {
    backgroundColor: '#f3f4f6',
  },
  modalButtonSecondaryText: { color: '#111', fontWeight: '600' },
});
