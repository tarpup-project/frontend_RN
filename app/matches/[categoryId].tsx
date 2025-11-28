import Header from "@/components/Header";
import PreviewModeBanner from "@/components/PreviewModeBanner";
import { Skeleton } from "@/components/Skeleton";
import { Text } from "@/components/Themedtext";
import { UrlConstants } from "@/constants/apiUrls";
import { useTheme } from "@/contexts/ThemeContext";
import { useCampus } from "@/hooks/useCampus";
import { useCategories } from "@/hooks/useCategories";
import { useAuthStore } from "@/state/authStore";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { router, useLocalSearchParams } from "expo-router";
import moment from "moment";
import { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

interface CategoryMatch {
  id: string;
  createdAt: string;
  members: Array<{
    user: {
      id: string;
      fname: string;
      bgUrl?: string;
    };
  }>;
  request?: {
    title: string;
  };
  group?: {
    name: string;
  };
}

const useCategoryMatches = (categoryId: string, campusId?: string) => {
  return useQuery({
    queryKey: ["categoryMatches", categoryId, campusId],
    queryFn: async () => {
      const response = await axios.get<{
        status: string;
        data: CategoryMatch[];
      }>(
        `${UrlConstants.baseUrl}${UrlConstants.fetchCategoryMatches(
          categoryId,
          campusId || ""
        )}`
      );

      return response.data.data;
    },
    enabled: !!categoryId && !!campusId,
    staleTime: 30 * 1000,
    retry: 2,
  });
};


const AnimatedZap = ({ color, size }: { color: string; size: number }) => {
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  return (
    <Animated.View style={{ opacity: opacityAnim }}>
      <Ionicons name="flash" size={size} color={color} />
    </Animated.View>
  );
};

const MatchCardSkeleton = () => {
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.matchCard,
        {
          backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
          borderColor: isDark ? "#333333" : "#E0E0E0",
        },
      ]}
    >
      <View style={styles.matchHeader}>
        <View style={styles.namesRow}>
          <Skeleton width={60} height={16} style={{ marginRight: 8 }} />
          <Skeleton
            width={12}
            height={12}
            borderRadius={6}
            style={{ marginRight: 8 }}
          />
          <Skeleton width={60} height={16} />
        </View>
      </View>
      <Skeleton width="80%" height={14} style={{ marginTop: 8 }} />
      <View style={styles.matchFooter}>
        <Skeleton width={80} height={12} />
      </View>
    </View>
  );
};

const AnimatedMatchCard = ({
  match,
  index,
  dynamicStyles,
}: {
  match: CategoryMatch;
  index: number;
  dynamicStyles: any;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: index * 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <Pressable
        style={[styles.matchCard, dynamicStyles.card]}
        onPress={() => console.log(`Navigate to match ${match.id}`)}
      >
        <View style={styles.matchContent}>
          <Text
            style={[styles.matchText, dynamicStyles.text]}
            numberOfLines={0}
          >
            <Text style={styles.matchName}>
              {match.members[0]?.user.fname || "User"}
            </Text>
            <Text> </Text>
            <View style={styles.zapContainer}>
              <AnimatedZap color="#00D084" size={12} />
            </View>
            <Text> </Text>
            <Text style={styles.matchName}>
              {match.members[1]?.user.fname || "Partner"}
            </Text>
            <Text style={styles.matchDescription}>
              {" "}
              for {match.request?.title || match.group?.name || "Connection"}
            </Text>
          </Text>
        </View>

        <View style={styles.matchFooter}>
        <Ionicons name="time-outline" size={14} color={dynamicStyles.subtitle.color} />
          <Text style={[styles.timeText, dynamicStyles.subtitle]}>
            {moment(match.createdAt).fromNow()}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const CategoryMatches = () => {
  const { categoryId } = useLocalSearchParams();
  const { isDark } = useTheme();
  const { selectedUniversity } = useCampus();
  const { data: categories } = useCategories(selectedUniversity?.id);
  const { isAuthenticated } = useAuthStore();

  const category = categories?.find((cat: any) => cat.id === categoryId);

  const {
    data: matches,
    isLoading: isLoadingMatches,
    error,
  } = useCategoryMatches(categoryId as string, selectedUniversity?.id);

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#0a0a0a",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
    card: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 12 }}>
          <Header />
          {!isAuthenticated && <PreviewModeBanner />}
        </View>

        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={dynamicStyles.text.color}
            />
            <Text style={[styles.backText, dynamicStyles.text]}>
              Back to Spot
            </Text>
          </Pressable>
        </View>

        <View style={styles.titleSection}>
          <View style={styles.titleContent}>
            <Text style={[styles.categoryTitle, dynamicStyles.text]}>
              {category?.name || "Category"} Matches
            </Text>
            {isLoadingMatches ? (
              <Skeleton width={120} height={14} />
            ) : (
              <Text style={[styles.matchCount, dynamicStyles.subtitle]}>
                {matches?.length || 0} recent connections
              </Text>
            )}
          </View>
        </View>

        <View style={styles.matchesList}>
          {isLoadingMatches ? (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <MatchCardSkeleton key={i} />
              ))}
            </>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, dynamicStyles.subtitle]}>
                Failed to load matches. Please try again.
              </Text>
            </View>
          ) : matches && matches.length > 0 ? (
            matches.map((match, index) => (
              <AnimatedMatchCard
                key={match.id}
                match={match}
                index={index}
                dynamicStyles={dynamicStyles}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, dynamicStyles.subtitle]}>
                No matches found for {category?.name || "this category"}.
              </Text>
              <Text style={[styles.emptySubtext, dynamicStyles.subtitle]}>
                Check back later for new connections!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backText: {
    fontSize: 13,
    fontWeight: "500",
  },
  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  titleContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  matchCount: {
    fontSize: 14,
    opacity: 0.7,
  },
  matchesList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  matchCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  matchContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  matchText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    flexWrap: "wrap",
  },
  zapContainer: {
    marginTop: 2,
  },
  matchName: {
    fontWeight: "600",
  },
  matchDescription: {
    fontWeight: "400",
    opacity: 0.8,
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  namesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  matchFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.6,
  },
  errorContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
});

export default CategoryMatches;
