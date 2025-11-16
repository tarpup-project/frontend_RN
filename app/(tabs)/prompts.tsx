import AuthModal from "@/components/AuthModal";
import Header from "@/components/Header";
import { Loader } from "@/components/Loader";
import PreviewModeBanner from "@/components/PreviewModeBanner";
import { Skeleton } from "@/components/Skeleton";
import { Text } from "@/components/Themedtext";
import { useTheme } from "@/contexts/ThemeContext";
import { useCampus } from "@/hooks/useCampus";
import { usePrompts } from "@/hooks/usePrompts";
import { useAuthStore } from "@/state/authStore";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Bed,
  BookOpenText,
  Briefcase,
  Car,
  Filter,
  Gamepad2,
  Gift,
  PartyPopper,
  ShoppingBag,
  UsersRound,
  Volleyball,
  X,
} from "lucide-react-native";
import moment from "moment";
import React, { useMemo, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { toast } from "sonner-native";

const iconMap: Record<string, any> = {
  "briefcase-business": Briefcase,
  "users-round": UsersRound,
  "gamepad-2": Gamepad2,
  gift: Gift,
  "shopping-bag": ShoppingBag,
  "party-popper": PartyPopper,
  car: Car,
  "bed-double": Bed,
  volleyball: Volleyball,
  "book-open-text": BookOpenText,
};

const getIconComponent = (iconName: string) => {
  const normalizedName = iconName.toLowerCase();
  return iconMap[normalizedName] || Filter;
};

const SkeletonCard = ({ isDark }: { isDark: boolean }) => {
  return (
    <View
      style={[
        styles.promptCard,
        {
          backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
          borderColor: isDark ? "#333333" : "#E0E0E0",
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.categoryBadgesContainer}>
          <Skeleton width={60} height={24} borderRadius={6} />
          <Skeleton width={60} height={24} borderRadius={6} />
        </View>
        <Skeleton width={70} height={32} borderRadius={6} />
      </View>
      <Skeleton
        width="100%"
        height={16}
        borderRadius={4}
        style={{ marginBottom: 8 }}
      />
      <Skeleton width="60%" height={12} borderRadius={4} />
    </View>
  );
};

const Prompts = () => {
  const { isDark } = useTheme();
  const { user, isAuthenticated } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showFullImage, setShowFullImage] = useState<string | null>(null);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );
  const { selectedUniversity } = useCampus();
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    string | undefined
  >(undefined);

  const {
    categories,
    prompts,
    lastUpdated,
    isLoadingCategories,
    isLoadingPrompts,
    isSubmitting,
    submitRequest,
    joinPublicGroup,
    refresh,
  } = usePrompts({
    campusID: selectedUniversity?.id,
    stateID: !selectedUniversity ? user?.stateID : undefined,
    selectedCategory: { index: selectedCategoryIndex, id: selectedCategoryId },
  });

  const dynamicStyles = {
    container: { backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF" },
    text: { color: isDark ? "#FFFFFF" : "#0a0a0a" },
    subtitle: { color: isDark ? "#9a9a9a" : "#666666" },
    sectionBg: { backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF" },
    categoryChip: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    filter: {
      color: isDark ? "#b2b2b2" : "#535353",
    },
    categoryChipActive: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000",
      borderColor: isDark ? "#FFFFFF" : "#000000",
    },
    categoryChipText: { color: isDark ? "#FFFFFF" : "#0a0a0a" },
    categoryChipTextActive: { color: isDark ? "#0a0a0a" : "#FFFFFF" },
    promptTitle: { color: isDark ? "#FFFFFF" : "#0a0a0a" },
    promptCard: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    requestButton: { backgroundColor: isDark ? "#FFFFFF" : "#0a0a0a" },
    requestButtonText: { color: isDark ? "#0a0a0a" : "#FFFFFF" },
  };

  const handleCategorySelect = (index: number, categoryId?: string) => {
    setSelectedCategoryIndex(index);
    setSelectedCategoryId(categoryId);
  };

  const handleRequestClick = async (
    promptId: string,
    publicGroupId?: string
  ) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    const loadingKey = publicGroupId || promptId;
    setLoadingStates((prev) => ({ ...prev, [loadingKey]: true }));

    try {
      if (publicGroupId) {
        await joinPublicGroup(publicGroupId);
        toast.success("Joined group successfully!");
        router.push("/(tabs)/groups");
      } else {
        await submitRequest(promptId);
        toast.success("Request submitted!");
        router.push("/chat");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit request");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  const timeAgo = useMemo(() => {
    if (!lastUpdated) return "Updated just now";
    const seconds = moment().diff(moment(lastUpdated), "seconds");
    if (seconds < 30) return "Updated just now";
    return moment(lastUpdated).fromNow();
  }, [lastUpdated]);

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Header />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refresh} />
        }
      >
        {!isAuthenticated && (
          <View style={{ marginTop: 16 }}>
            <PreviewModeBanner />
          </View>
        )}
        <View style={[styles.feedHeader, dynamicStyles.sectionBg]}>
          <View style={styles.feedTitleRow}>
            <Text style={[styles.feedTitle, dynamicStyles.text]}>
              Live Prompts Feed
            </Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
          <Text style={[styles.feedSubtitle, dynamicStyles.subtitle]}>
            Real-time campus needs and connections
          </Text>
          <View style={styles.statItem}>
            <Ionicons
              name="time-outline"
              size={14}
              color={dynamicStyles.subtitle.color}
            />
            <Text style={[styles.statText, dynamicStyles.subtitle]}>
              {timeAgo}
            </Text>
          </View>
        </View>

        <View style={styles.filterSection}>
          <View style={styles.filterHeader}>
            <Ionicons
              name="funnel-outline"
              size={16}
              color={dynamicStyles.text.color}
            />
            <Text style={[styles.filterTitle, dynamicStyles.filter]}>
              Filter by category
            </Text>
          </View>

          {isLoadingCategories ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentInset={{ left: 16, right: 16 }}
              contentContainerStyle={[
                styles.categoriesScroll,
                { paddingHorizontal: 16 },
              ]}
            >
              {[1, 2, 3, 4, 5].map((_, i) => (
                <Skeleton
                  key={i}
                  width={100}
                  height={36}
                  borderRadius={8}
                  style={{ marginRight: 8 }}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={{ paddingHorizontal: 14 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesScroll}
              >
                <Pressable
                  style={[
                    styles.categoryChip,
                    dynamicStyles.categoryChip,
                    selectedCategoryIndex === 0 && [
                      dynamicStyles.categoryChipActive,
                    ],
                  ]}
                  onPress={() => handleCategorySelect(0, undefined)}
                >
                  <Filter
                    size={16}
                    color={
                      selectedCategoryIndex === 0
                        ? dynamicStyles.categoryChipTextActive.color
                        : dynamicStyles.categoryChipText.color
                    }
                    strokeWidth={2}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      dynamicStyles.categoryChipText,
                      selectedCategoryIndex === 0 && [
                        dynamicStyles.categoryChipTextActive,
                      ],
                    ]}
                  >
                    All
                  </Text>
                </Pressable>

                {categories.map((category, index) => {
                  const IconComponent = getIconComponent(category.icon);
                  return (
                    <Pressable
                      key={category.id}
                      style={[
                        styles.categoryChip,
                        dynamicStyles.categoryChip,
                        selectedCategoryIndex === index + 1 && [
                          dynamicStyles.categoryChipActive,
                        ],
                      ]}
                      onPress={() =>
                        handleCategorySelect(index + 1, category.id)
                      }
                    >
                      <IconComponent
                        size={16}
                        color={
                          selectedCategoryIndex === index + 1
                            ? dynamicStyles.categoryChipTextActive.color
                            : dynamicStyles.categoryChipText.color
                        }
                        strokeWidth={2}
                      />
                      <Text
                        style={[
                          styles.categoryText,
                          dynamicStyles.categoryChipText,
                          selectedCategoryIndex === index + 1 && [
                            dynamicStyles.categoryChipTextActive,
                          ],
                        ]}
                      >
                        {category.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.promptsList}>
          {isLoadingPrompts && (
            <>
              <SkeletonCard isDark={isDark} />
              <SkeletonCard isDark={isDark} />
              <SkeletonCard isDark={isDark} />
              <SkeletonCard isDark={isDark} />
              <SkeletonCard isDark={isDark} />
            </>
          )}
          {!isLoadingPrompts && prompts.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, dynamicStyles.subtitle]}>
                No prompts found
              </Text>
            </View>
          )}
          {!isLoadingPrompts &&
            prompts.map((prompt) => (
              <View
                key={prompt.id}
                style={[styles.promptCard, dynamicStyles.promptCard]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.categoryBadgesContainer}>
                    {prompt.category.slice(0, 2).map((cat) => {
                      const IconComponent = getIconComponent(cat.icon);
                      return (
                        <View
                          key={cat.id}
                          style={[
                            styles.categoryBadge,
                            { backgroundColor: cat.bgColorHex },
                          ]}
                        >
                          <IconComponent
                            size={12}
                            color={cat.colorHex}
                            strokeWidth={2}
                          />
                          <Text
                            style={[styles.badgeText, { color: cat.colorHex }]}
                          >
                            {cat.name}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                  <View style={styles.headerRight}>
                    <View style={styles.timeRow}>
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={isDark ? "#FFFFFF" : "#999999"}
                      />
                      <Text
                        style={[
                          styles.timeText,
                          { color: isDark ? "#CCCCCC" : "#999999" },
                        ]}
                      >
                        {moment(prompt.createdAt).fromNow()}
                      </Text>
                    </View>
                    {!(user && user.id === prompt.owner.id) && (
                      <Pressable
                        style={[
                          styles.requestButton,
                          dynamicStyles.requestButton,
                          loadingStates[prompt.publicGroupID || prompt.id] &&
                            styles.requestButtonDisabled,
                        ]}
                        onPress={() =>
                          handleRequestClick(prompt.id, prompt.publicGroupID)
                        }
                        disabled={
                          loadingStates[prompt.publicGroupID || prompt.id]
                        }
                      >
                        {loadingStates[prompt.publicGroupID || prompt.id] ? (
                          <Loader
                            color={dynamicStyles.requestButtonText.color}
                            text={
                              prompt.publicGroupID
                                ? "Joining..."
                                : "Requesting..."
                            }
                            textStyle={dynamicStyles.requestButtonText}
                          />
                        ) : (
                          <Text
                            style={[
                              styles.requestButtonText,
                              dynamicStyles.requestButtonText,
                            ]}
                          >
                            {prompt.publicGroupID ? "Join" : "Request"}
                          </Text>
                        )}
                      </Pressable>
                    )}
                  </View>
                </View>
                <Text style={[styles.promptTitle, dynamicStyles.promptTitle]}>
                  {prompt.description}
                </Text>

                {prompt.imageFile && (
                  <Pressable
                    style={styles.imageContainer}
                    onPress={() => setShowFullImage(prompt.imageFile!.url)}
                  >
                    <Image
                      source={{ uri: prompt.imageFile.url }}
                      style={styles.promptImage}
                      resizeMode="cover"
                    />
                  </Pressable>
                )}
                <Text style={[styles.authorText, dynamicStyles.subtitle]}>
                  by {prompt.owner.fname}
                  {prompt.owner.isStudent &&
                    !prompt.owner.profileVerified &&
                    " (unverified)"}
                </Text>
              </View>
            ))}
        </View>
      </ScrollView>

      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      <Modal
        visible={!!showFullImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFullImage(null)}
      >
        <View style={styles.imageModalOverlay}>
          <Pressable
            style={styles.imageModalBackground}
            onPress={() => setShowFullImage(null)}
          >
            <View style={styles.imageModalContent}>
              <Pressable
                style={styles.closeButton}
                onPress={() => setShowFullImage(null)}
              >
                <X size={28} color="#FFFFFF" />
              </Pressable>

              {showFullImage && (
                <Image
                  source={{ uri: showFullImage }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  feedHeader: { padding: 16, marginBottom: 8 },
  feedTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  categoryText: { fontSize: 12, fontWeight: "500" },
  requestButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 70,
    alignItems: "center",
  },
  requestButtonDisabled: { opacity: 0.5 },
  requestButtonText: { fontSize: 10, fontWeight: "600" },
  feedTitle: { fontSize: 14, fontWeight: "700" },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#00FF00" },
  liveText: { color: "#00FF00", fontSize: 10, fontWeight: "bold" },
  feedSubtitle: { fontSize: 14, marginBottom: 12, fontWeight: "600" },
  statItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  statText: { fontSize: 10 },
  filterSection: { paddingVertical: 16 },
  headerRight: {
    display: "flex",
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  filterTitle: { fontSize: 14, fontWeight: "700" },
  categoriesScroll: {
    paddingLeft: 2,
    paddingRight: 16,
    gap: 8,
    alignItems: "center",
  },
  promptsList: { padding: 16, gap: 16 },
  promptCard: { padding: 16, borderRadius: 12, borderWidth: 1 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryBadgesContainer: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    flex: 1,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: "600" },
  timeText: { fontSize: 10, color: "#999999" },
  promptTitle: {
    fontSize: 11.5,
    marginBottom: 8,
    lineHeight: 20,
    fontWeight: "700",
  },
  authorText: { fontSize: 11 },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  imageContainer: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    overflow: "hidden",
    marginVertical: 8,
  },
  promptImage: {
    width: "100%",
    height: "100%",
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1,
    padding: 8,
  },
  fullImage: {
    width: "90%",
    height: "90%",
    maxWidth: 500,
    maxHeight: 500,
  },
  emptyText: { fontSize: 14 },
});

export default Prompts;
