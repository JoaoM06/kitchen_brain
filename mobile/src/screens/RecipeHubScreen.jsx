import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Modal,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Video } from "expo-av";
import SafeScreen from "../components/SafeScreen";
import DefaultButton from "../components/DefaultButton";
import FooterNav from "../components/FooterNav";
import { colors } from "../theme/colors";
import { HUB_POSTS, HUB_TAGS } from "../data/recipeHub";
import {
  getCommunityPosts,
  getHubReactions,
  setRating as storageSetRating,
  toggleLike as storageToggleLike,
  toggleSave as storageToggleSave,
} from "../storage/recipeHub";

const getMediaInfo = (post) => {
  const mediaType = post.mediaType || (post.videoUri ? "video" : "image");
  const uri =
    post.mediaUri ||
    (mediaType === "video" ? post.videoUri : null) ||
    post.image ||
    post.videoUri ||
    null;
  return { mediaType, uri };
};

export default function RecipeHubScreen({ navigation }) {
  const [communityPosts, setCommunityPosts] = useState([]);
  const [reactions, setReactions] = useState({ likedIds: [], savedIds: [], ratings: {} });
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("all");
  const [loading, setLoading] = useState(true);
  const [filterVisible, setFilterVisible] = useState(false);

  const loadHub = useCallback(async () => {
    setLoading(true);
    try {
      const [posts, reactionState] = await Promise.all([getCommunityPosts(), getHubReactions()]);
      setCommunityPosts(posts);
      setReactions(reactionState);
    } catch (err) {
      console.warn("Erro ao carregar hub", err);
      Alert.alert("Hub", "Não foi possível carregar o feed agora.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHub();
    }, [loadHub])
  );

  const feed = useMemo(() => {
    const combined = [...communityPosts, ...HUB_POSTS];
    return combined
      .map((post) => {
        const liked = reactions.likedIds?.includes(post.id);
        const saved = reactions.savedIds?.includes(post.id);
        const userRating = reactions.ratings?.[post.id] ?? 0;
        return {
          ...post,
          liked,
          saved,
          userRating,
          displayLikes: Math.max(0, (post.likes || 0) + (liked ? 1 : 0)),
          displaySaves: Math.max(0, (post.saves || 0) + (saved ? 1 : 0)),
        };
      })
      .filter((post) => filterByTag(post, activeTag))
      .filter((post) => {
        if (!search.trim()) return true;
        const normalized = search.trim().toLowerCase();
        return (
          post.title?.toLowerCase().includes(normalized) ||
          post.description?.toLowerCase().includes(normalized) ||
          post.tags?.some((tag) => tag.toLowerCase().includes(normalized))
        );
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || a.publishedAt || 0).getTime();
        const dateB = new Date(b.createdAt || b.publishedAt || 0).getTime();
        return dateB - dateA;
      });
  }, [communityPosts, reactions, activeTag, search]);

  const stats = useMemo(() => {
    const totalSaves = feed.reduce((acc, post) => acc + (post.displaySaves || 0), 0);
    return {
      totalPosts: feed.length,
      communityPosts: communityPosts.length,
      totalSaves,
    };
  }, [feed, communityPosts.length]);

  const handleToggleSave = async (postId) => {
    const next = await storageToggleSave(postId);
    setReactions(next);
  };

  const handleToggleLike = async (postId) => {
    const next = await storageToggleLike(postId);
    setReactions(next);
  };

  const handleRate = async (postId, value) => {
    const next = await storageSetRating(postId, value);
    setReactions(next);
  };

  const handleShare = async (post) => {
    try {
      await Share.share({
        title: post.title,
        message: `Olha essa receita do Hub KitchenBrain: ${post.title}\n\n${post.description}`,
      });
    } catch (err) {
      console.warn("Share error", err);
    }
  };

  const renderPost = ({ item }) => (
    <HubPostCard
      post={item}
      onLike={() => handleToggleLike(item.id)}
      onSave={() => handleToggleSave(item.id)}
      onShare={() => handleShare(item)}
      onRate={(value) => handleRate(item.id, value)}
    />
  );

  return (
    <SafeScreen>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Hub de Receitas</Text>
          <Text style={styles.subtitle}>Compartilhe e descubra criações da comunidade</Text>
        </View>
        <Pressable style={styles.createButton} onPress={() => navigation.navigate("RecipeHubCreate")}>
          <Ionicons name="add" size={20} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Receitas ativas" value={stats.totalPosts} icon="flame-outline" />
        <StatCard label="Salvos" value={stats.totalSaves} icon="bookmark-outline" />
        <StatCard label="Suas criações" value={stats.communityPosts} icon="sparkles-outline" />
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={18} color={colors.mutedText} />
          <TextInput
            placeholder="Buscar por nome ou ingrediente"
            placeholderTextColor={colors.mutedText}
            value={search}
            onChangeText={setSearch}
            style={styles.searchText}
            autoCorrect={false}
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setFilterVisible(true)}>
          <Ionicons name="filter" size={18} color={colors.primary} />
          <Text style={styles.filterButtonText}>
            {HUB_TAGS.find((tag) => tag.id === activeTag)?.label || "Filtro"}
          </Text>
        </TouchableOpacity>
        <DefaultButton
          variant="outline"
          style={styles.publishBtn}
          onPress={() => navigation.navigate("RecipeHubCreate")}
        >
          Publicar
        </DefaultButton>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={feed}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-ellipses-outline" size={32} color={colors.mutedText} />
              <Text style={styles.emptyTitle}>Nenhuma receita por aqui</Text>
              <Text style={styles.emptySubtitle}>
                Publique algo agora mesmo para inspirar outros cozinheiros.
              </Text>
              <DefaultButton onPress={() => navigation.navigate("RecipeHubCreate")}>
                Compartilhar receita
              </DefaultButton>
            </View>
          }
        />
      )}

      <FooterNav active="RecipeHub" onNavigate={navigation.replace} />
      <FilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        activeTag={activeTag}
        onSelect={(tag) => {
          setActiveTag(tag);
          setFilterVisible(false);
        }}
      />
    </SafeScreen>
  );
}

function filterByTag(post, tag) {
  if (tag === "all") return true;
  const tags = post.tags?.map((t) => t.toLowerCase()) || [];
  if (tag === "veg") return tags.some((t) => t.includes("veg"));
  if (tag === "dessert") return tags.some((t) => t.includes("doce") || t.includes("dessert"));
  if (tag === "baked") return tags.some((t) => t.includes("pão") || t.includes("assado"));
  if (tag === "quick") {
    if (!post.prepTime) return false;
    const minutes = parseInt(post.prepTime);
    return minutes && minutes <= 30;
  }
  return true;
}

function HubPostCard({ post, onLike, onSave, onShare, onRate }) {
  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.avatarWrap}>
          {post.author?.avatar ? (
            <Image source={{ uri: post.author.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{post.author?.name?.[0] || "?"}</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.postAuthor}>{post.author?.name || "Criador anônimo"}</Text>
          <Text style={styles.postHandle}>{post.author?.handle}</Text>
        </View>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={14} color="#FACC15" />
          <Text style={styles.ratingText}>{(post.userRating || post.rating || 0).toFixed(1)}</Text>
        </View>
      </View>

      <MediaPreview post={post} />

      <Text style={styles.postTitle}>{post.title}</Text>
      <Text style={styles.postDescription}>{post.description}</Text>

      <View style={styles.tagRow}>
        {(post.tags || []).map((tag) => (
          <View key={`${post.id}-${tag}`} style={styles.tagPill}>
            <Text style={styles.tagPillText}>#{tag}</Text>
          </View>
        ))}
      </View>

      <View style={styles.metaRow}>
        <Ionicons name="time-outline" size={16} color={colors.mutedText} />
        <Text style={styles.metaText}>{post.prepTime || "Tempo livre"}</Text>
        <Ionicons name="flask-outline" size={16} color={colors.mutedText} style={{ marginLeft: 12 }} />
        <Text style={styles.metaText}>{post.difficulty || "Fácil"}</Text>
      </View>

      <View style={styles.actionsRow}>
        <ActionButton
          icon={post.liked ? "heart" : "heart-outline"}
          label={`${post.displayLikes} curtidas`}
          active={post.liked}
          onPress={onLike}
        />
        <ActionButton
          icon={post.saved ? "bookmark" : "bookmark-outline"}
          label={`${post.displaySaves} salvos`}
          active={post.saved}
          onPress={onSave}
        />
        <ActionButton icon="share-social-outline" label="Compartilhar" onPress={onShare} />
      </View>

      <View style={styles.ratingRow}>
        <Text style={styles.ratingLabel}>Avaliar:</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Pressable key={star} onPress={() => onRate(star)}>
              <Ionicons
                name={star <= (post.userRating || post.rating || 0) ? "star" : "star-outline"}
                size={20}
                color="#FACC15"
                style={{ marginHorizontal: 2 }}
              />
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

function ActionButton({ icon, label, active, onPress }) {
  return (
    <Pressable style={[styles.actionBtn, active && styles.actionBtnActive]} onPress={onPress}>
      <Ionicons name={icon} size={18} color={active ? colors.primary : colors.mutedText} />
      <Text style={[styles.actionText, active && styles.actionTextActive]}>{label}</Text>
    </Pressable>
  );
}

function MediaPreview({ post }) {
  const { mediaType, uri } = getMediaInfo(post);
  if (mediaType === "video" && uri) {
    return (
      <Video
        source={{ uri }}
        style={styles.postImage}
        useNativeControls
        resizeMode="cover"
      />
    );
  }
  const fallback = uri ? { uri } : require("../../assets/imgs/chef.png");
  return <Image source={fallback} style={styles.postImage} />;
}

function StatCard({ label, value, icon }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function FilterModal({ visible, onClose, activeTag, onSelect }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Filtrar receitas</Text>
          {HUB_TAGS.map((tag) => {
            const selected = tag.id === activeTag;
            return (
              <Pressable
                key={tag.id}
                style={[styles.modalOption, selected && styles.modalOptionActive]}
                onPress={() => onSelect(tag.id)}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    selected && styles.modalOptionTextActive,
                  ]}
                >
                  {tag.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 14,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  statCard: {
    backgroundColor: colors.primary50,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    minWidth: 100,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.mutedText,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 4,
  },
  searchInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchText: {
    flex: 1,
    color: colors.text,
  },
  publishBtn: {
    paddingHorizontal: 20,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  filterButtonText: {
    color: colors.primary,
    fontWeight: "600",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    gap: 10,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  emptySubtitle: {
    color: colors.mutedText,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  postCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F1F1",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    marginRight: 10,
    backgroundColor: colors.primary50,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary50,
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
  },
  postAuthor: {
    fontWeight: "700",
    color: colors.text,
  },
  postHandle: {
    color: colors.mutedText,
    fontSize: 12,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontWeight: "700",
    color: "#B45309",
    marginLeft: 4,
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    marginBottom: 12,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  postDescription: {
    color: colors.mutedText,
    marginTop: 6,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  tagPill: {
    backgroundColor: colors.primary50,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagPillText: {
    fontSize: 12,
    color: colors.primary700,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  metaText: {
    color: colors.mutedText,
    marginLeft: 4,
    fontSize: 13,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    borderTopWidth: 1,
    borderColor: "#F3F4F6",
    paddingTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  actionBtnActive: {
    opacity: 1,
  },
  actionText: {
    fontSize: 13,
    color: colors.mutedText,
  },
  actionTextActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  ratingLabel: {
    fontWeight: "600",
    color: colors.text,
    marginRight: 10,
  },
  starsRow: {
    flexDirection: "row",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalOptionActive: {
    backgroundColor: colors.primary50,
    borderColor: colors.primary,
  },
  modalOptionText: {
    color: colors.text,
    fontWeight: "600",
  },
  modalOptionTextActive: {
    color: colors.primary,
  },
});
