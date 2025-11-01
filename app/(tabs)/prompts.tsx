import React, { useMemo, useState, Suspense, lazy } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import moment from "moment";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  BookOpen,
  Calendar,
  Car,
  Dumbbell,
  Filter,
  Gift,
  Heart,
  Home,
  Music,
  ShoppingBag,
} from "lucide-react-native";
import { useTheme } from "@/app/contexts/ThemeContext";
import { Text } from "@/components/Themedtext";
import { usePrompts } from "@/hooks/usePrompts";
import { useAuthStore } from "@/state/authStore";
import { toast } from "sonner-native";

const Header = lazy(() => import("@/components/Header"));
const PreviewModeBanner = lazy(() => import("@/components/PreviewModeBanner"));

const iconMap: Record<string, any> = {
  car: Car,
  calendar: Calendar,
  music: Music,
  "shopping-bag": ShoppingBag,
  book: BookOpen,
  dumbbell: Dumbbell,
  home: Home,
  heart: Heart,
  gift: Gift,
};

const getIconComponent = (iconName: string) => {
  const normalizedName = iconName.toLowerCase();
  return iconMap[normalizedName] || Filter;
};

const SkeletonCard = ({ isDark }: { isDark: boolean }) => {
  const skeletonColor = isDark ? "#1A1A1A" : "#F0F0F0";
  return (
    <View
      style={[
        styles.promptCard,
        {
          backgroundColor: isDark ? "#000000" : "#FFFFFF",
          borderColor: isDark ? "#333333" : "#E0E0E0",
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.categoryBadgesContainer}>
          <View style={[styles.skeletonBadge, { backgroundColor: skeletonColor }]} />
          <View style={[styles.skeletonBadge, { backgroundColor: skeletonColor }]} />
        </View>
        <View style={[styles.skeletonButton, { backgroundColor: skeletonColor }]} />
      </View>
      <View style={[styles.skeletonTitle, { backgroundColor: skeletonColor }]} />
      <View style={[styles.skeletonSubtitle, { backgroundColor: skeletonColor }]} />
    </View>
  );
};

const Prompts = () => {
  const { isDark } = useTheme();
  const { user, isAuthenticated } = useAuthStore();
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);

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
    campusID: user?.isStudent ? user?.universityID : undefined,
    stateID: !user?.isStudent ? user?.stateID : undefined,
    selectedCategory: { index: selectedCategoryIndex, id: selectedCategoryId },
  });

  const dynamicStyles = {
    container: { backgroundColor: isDark ? "#000000" : "#FFFFFF" },
    text: { color: isDark ? "#FFFFFF" : "#000000" },
    subtitle: { color: isDark ? "#CCCCCC" : "#666666" },
    sectionBg: { backgroundColor: isDark ? "#000000" : "#F9F9F9" },
    categoryChip: { backgroundColor: isDark ? "#000000" : "#FFFFFF", borderColor: isDark ? "#333333" : "#E0E0E0" },
    categoryChipActive: { backgroundColor: isDark ? "#FFFFFF" : "#000000", borderColor: isDark ? "#FFFFFF" : "#000000" },
    categoryChipText: { color: isDark ? "#FFFFFF" : "#000000" },
    categoryChipTextActive: { color: isDark ? "#000000" : "#FFFFFF" },
    promptTitle: { color: isDark ? "#FFFFFF" : "#000000" },
    promptCard: { backgroundColor: isDark ? "#000000" : "#FFFFFF", borderColor: isDark ? "#333333" : "#E0E0E0" },
    requestButton: { backgroundColor: isDark ? "#FFFFFF" : "#000000" },
    requestButtonText: { color: isDark ? "#000000" : "#FFFFFF" },
  };

  const handleCategorySelect = (index: number, categoryId?: string) => {
    setSelectedCategoryIndex(index);
    setSelectedCategoryId(categoryId);
  };

  const handleRequestClick = async (promptId: string, publicGroupId?: string) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to request");
      router.push("/(auth)/signin");
      return;
    }
    try {
      if (publicGroupId) {
        await joinPublicGroup(publicGroupId);
        toast.success("Joined group successfully!");
        router.push("/(tabs)/groups");
      } else {
        await submitRequest(promptId);
        toast.success("Request submitted!");
        router.push("/request-chat");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit request");
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
      <Suspense fallback={<></>}>
        <View style={{ gap: 12 }}>
          <Header />
          <PreviewModeBanner />
        </View>
      </Suspense>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={isLoadingPrompts && prompts.length > 0} onRefresh={refresh} />}
      >
        <View style={[styles.feedHeader, dynamicStyles.sectionBg]}>
          <View style={styles.feedTitleRow}>
            <Text style={[styles.feedTitle, dynamicStyles.text]}>Live Prompts Feed</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
          <Text style={[styles.feedSubtitle, dynamicStyles.subtitle]}>Real-time campus needs and connections</Text>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={14} color={dynamicStyles.subtitle.color} />
            <Text style={[styles.statText, dynamicStyles.subtitle]}>{timeAgo}</Text>
          </View>
        </View>

        <View style={styles.filterSection}>
          <View style={styles.filterHeader}>
            <Ionicons name="funnel-outline" size={16} color={dynamicStyles.text.color} />
            <Text style={[styles.filterTitle, dynamicStyles.text]}>Filter by Category</Text>
          </View>

          {isLoadingCategories ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
              {[1, 2, 3, 4, 5].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: isDark ? "#1A1A1A" : "#F0F0F0",
                      borderColor: isDark ? "#333333" : "#E0E0E0",
                      width: 100,
                      height: 36,
                    },
                  ]}
                />
              ))}
            </ScrollView>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
              <Pressable
                style={[
                  styles.categoryChip,
                  dynamicStyles.categoryChip,
                  selectedCategoryIndex === 0 && [dynamicStyles.categoryChipActive],
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
                    selectedCategoryIndex === 0 && [dynamicStyles.categoryChipTextActive],
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
                      selectedCategoryIndex === index + 1 && [dynamicStyles.categoryChipActive],
                    ]}
                    onPress={() => handleCategorySelect(index + 1, category.id)}
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
                        selectedCategoryIndex === index + 1 && [dynamicStyles.categoryChipTextActive],
                      ]}
                    >
                      {category.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
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
              <Text style={[styles.emptyText, dynamicStyles.subtitle]}>No prompts found</Text>
            </View>
          )}
          {!isLoadingPrompts &&
            prompts.map((prompt) => (
              <View key={prompt.id} style={[styles.promptCard, dynamicStyles.promptCard]}>
                <View style={styles.cardHeader}>
                  <View style={styles.categoryBadgesContainer}>
                    {prompt.category.slice(0, 2).map((cat) => {
                      const IconComponent = getIconComponent(cat.icon);
                      return (
                        <View key={cat.id} style={[styles.categoryBadge, { backgroundColor: cat.bgColorHex }]}>
                          <IconComponent size={12} color={cat.colorHex} strokeWidth={2} />
                          <Text style={[styles.badgeText, { color: cat.colorHex }]}>{cat.name}</Text>
                        </View>
                      );
                    })}
                  </View>
                  <View style={styles.headerRight}>
                    <View style={styles.timeRow}>
                      <Ionicons name="time-outline" size={14} color="#999999" />
                      <Text style={styles.timeText}>{moment(prompt.createdAt).fromNow()}</Text>
                    </View>
                    {!(user && user.id === prompt.owner.id) && (
                      <Pressable
                        style={[
                          styles.requestButton,
                          dynamicStyles.requestButton,
                          isSubmitting && styles.requestButtonDisabled,
                        ]}
                        onPress={() => handleRequestClick(prompt.id, prompt.publicGroupID)}
                        disabled={isSubmitting}
                      >
                        <Text style={[styles.requestButtonText, dynamicStyles.requestButtonText]}>
                          {prompt.publicGroupID ? "Join" : "Request"}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
                <Text style={[styles.promptTitle, dynamicStyles.promptTitle]}>{prompt.description}</Text>
                <Text style={[styles.authorText, dynamicStyles.subtitle]}>
                  by {prompt.owner.fname}
                  {prompt.owner.isStudent && !prompt.owner.profileVerified && " (unverified)"}
                </Text>
              </View>
            ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  feedHeader: { padding: 16, marginBottom: 8 },
  feedTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  categoryText: { fontSize: 12, fontWeight: "500" },
  requestButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 70,
    alignItems: "center",
  },
  requestButtonDisabled: { opacity: 0.5 },
  requestButtonText: { fontSize: 13, fontWeight: "600" },
  feedTitle: { fontSize: 14, fontWeight: "bold" },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#00FF00" },
  liveText: { color: "#00FF00", fontSize: 10, fontWeight: "bold" },
  feedSubtitle: { fontSize: 14, marginBottom: 12 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  statText: { fontSize: 12 },
  filterSection: { paddingVertical: 16 },
  headerRight: { display: "flex", flexDirection: "row", gap: 8, alignItems: "center" },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  filterHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, marginBottom: 20 },
  filterTitle: { fontSize: 14, fontWeight: "600" },
  categoriesScroll: { paddingHorizontal: 16, gap: 8 },
  promptsList: { padding: 16, gap: 16 },
  promptCard: { padding: 16, borderRadius: 12, borderWidth: 1 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  categoryBadgesContainer: { flexDirection: "row", gap: 6, flexWrap: "wrap", flex: 1 },
  categoryBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  categoryChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  timeText: { fontSize: 10, color: "#999999" },
  promptTitle: { fontSize: 14, marginBottom: 8, lineHeight: 20, fontWeight: "500" },
  authorText: { fontSize: 12 },
  emptyContainer: { padding: 40, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 14 },
  skeletonBadge: { width: 60, height: 24, borderRadius: 6 },
  skeletonButton: { width: 70, height: 32, borderRadius: 6 },
  skeletonTitle: { width: "100%", height: 16, borderRadius: 4, marginBottom: 8 },
  skeletonSubtitle: { width: "60%", height: 12, borderRadius: 4 },
});

export default Prompts;
