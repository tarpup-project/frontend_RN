import { useTheme } from "@/app/contexts/ThemeContext";
import Header from "@/components/Header";
import LeaderBoard from "@/components/Leaderboard";
import PreviewModeBanner from "@/components/PreviewModeBanner";
import { Skeleton } from "@/components/Skeleton";
import { Text } from "@/components/Themedtext";
import { useCampus } from "@/hooks/useCampus";

import { useCategories } from "@/hooks/useCategories";
import { useRecentMatches } from "@/hooks/useRecentMatches";
import { useAuthStore } from "@/state/authStore";
import { Category } from "@/types/prompts";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  BookOpen,
  Car,
  Gamepad2,
  Gift,
  Heart,
  Home,
  PartyPopper,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Trophy,
} from "lucide-react-native";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";


const getIconComponent = (iconName: any, categoryName?: string) => {
  if (typeof iconName === 'object' && iconName.$$typeof) {
    if (categoryName) {
 
      const nameMap: Record<string, any> = {
        'giveaway': Gift,
        'sports': Trophy,
        'friends': Heart,
        'market': ShoppingBag,
        'games': Gamepad2,
        'party': PartyPopper,
        'rides': Car,
        'roommates': Home,
        'dating': Heart,
        'study group': BookOpen,
      };
      
      const normalized = categoryName.toLowerCase().trim();
      return nameMap[normalized] || Car;
    }
    return Car;
  }
  

  if (typeof iconName !== "string") return Car;
  
  const normalized = iconName.trim().toLowerCase().replace(/-/g, '');
  
  const iconMap: Record<string, any> = {
    car: Car,
    home: Home,
    shoppingbag: ShoppingBag,
    gamepad2: Gamepad2,
    heart: Heart,
    bookopen: BookOpen,
    gift: Gift,
    partypopper: PartyPopper,
    trophy: Trophy,
    trendingup: TrendingUp,
    sparkles: Sparkles,
  };

  return iconMap[normalized] || Car;
};

const CategoryCardSkeleton = () => {
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
          borderColor: isDark ? "#333333" : "#E0E0E0",
        },
      ]}
    >
      <Skeleton
        width={50}
        height={50}
        borderRadius={25}
        style={{ marginBottom: 20 }}
      />
      <Skeleton width="80%" height={16} style={{ marginBottom: 10 }} />
      <Skeleton width="90%" height={12} style={{ marginBottom: 15 }} />
      <Skeleton width={80} height={20} borderRadius={12} />
    </View>
  );
};

const UniversityDropdownSkeleton = () => (
  <View style={{ gap: 8 }}>
    {Array.from({ length: 5 }).map((_, i) => (
      <View key={i} style={[styles.dropdownItem, { gap: 12 }]}>
        <View style={{ flex: 1 }}>
          <Skeleton width="70%" height={16} style={{ marginBottom: 4 }} />
          <Skeleton width="50%" height={12} />
        </View>
      </View>
    ))}
  </View>
);

const RecentMatchSkeleton = () => {
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.recentCard,
        {
          backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
          borderColor: isDark ? "#333333" : "#E0E0E0",
        },
      ]}
    >
      <Skeleton width={40} height={40} borderRadius={20} />
      <View style={styles.recentContent}>
        <Skeleton width="80%" height={16} style={{ marginBottom: 4 }} />
        <View style={styles.recentUsers}>
          <Skeleton width={60} height={12} />
        </View>
      </View>
      <View style={styles.recentRight}>
        <Skeleton width={50} height={12} style={{ marginBottom: 4 }} />
        <Skeleton width={40} height={20} borderRadius={8} />
      </View>
    </View>
  );
};

const Index = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAllRecent, setShowAllRecent] = useState(false);

  const { isDark } = useTheme();
  const { isAuthenticated } = useAuthStore();

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const {
    selectedUniversity,
    universities,
    isLoading: isLoadingUniversities,
    setSelectedUniversity,
    reset,
  } = useCampus();

  const { data: recentMatchesData, isLoading: isLoadingRecentMatches } =
    useRecentMatches(
      selectedUniversity?.id,
      !selectedUniversity ? undefined : undefined
    );

  const { data: categories = [], isLoading: isLoadingCategories } =
    useCategories(selectedUniversity?.id);

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
    filterContainer: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    innerCard: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    card: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    matchesBadge: {
      backgroundColor: isDark ? "#444953" : "#E0E0E0",
    },
    avatarBorder: {
      borderColor: isDark ? "#000000" : "#FFFFFF",
    },
    compatibilityCard: {
      backgroundColor: isDark ? "#202123" : "#f0f1f3",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Header />

      <ScrollView style={styles.content}>
        {/* Conditional rendering: LeaderBoard for authenticated users, PreviewModeBanner for non-authenticated */}
        {isAuthenticated ? (
          <LeaderBoard />
        ) : (
          <View style={{ marginTop: 16, marginHorizontal: -16 }}>
            <PreviewModeBanner />
          </View>
        )}

        <View
          style={[
            styles.filterSection,
            styles.dashed,
            dynamicStyles.filterContainer,
          ]}
        >
          <View style={styles.filterHeader}>
            <Ionicons
              name="funnel-outline"
              size={16}
              color={dynamicStyles.text.color}
            />
            <Text style={[styles.filterTitle, dynamicStyles.text]}>
              Filter Campus Needs
            </Text>

            <View style={styles.realTimeBadge}>
              <Text style={[styles.realTimeText, dynamicStyles.text]}>
                Real-Time
              </Text>
            </View>
          </View>

          <View style={[styles.innerCard, dynamicStyles.innerCard]}>
            <Text style={[styles.universityLabel, dynamicStyles.text]}>
              University:
            </Text>

            <View style={{ position: "relative" }}>
              <Pressable
                style={[styles.campusSelector, dynamicStyles.innerCard]}
                onPress={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <View style={styles.campusRow}>
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={dynamicStyles.text.color}
                  />
                  <View style={styles.dotIndicator} />
                  <Text style={[styles.campusText, dynamicStyles.text]}>
                    {isLoadingUniversities
                      ? "Loading universities..."
                      : selectedUniversity?.name || "Select your university"}
                  </Text>
                  <Ionicons
                    name={isDropdownOpen ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={dynamicStyles.text.color}
                  />
                </View>
              </Pressable>

              {isDropdownOpen && (
                <ScrollView
                  style={[styles.dropdown, dynamicStyles.innerCard]}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                >
                  {isLoadingUniversities ? (
                    <UniversityDropdownSkeleton />
                  ) : (
                    universities.map((uni) => (
                      <Pressable
                        key={uni.id}
                        style={[
                          styles.dropdownItem,
                          {
                            borderBottomColor:
                              dynamicStyles.innerCard.borderColor,
                          },
                        ]}
                        onPress={() => {
                          setSelectedUniversity(uni);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[styles.dropdownText, dynamicStyles.text]}
                          >
                            {uni.name}
                          </Text>
                        </View>
                        {selectedUniversity?.id === uni.id && (
                          <Ionicons
                            name="checkmark"
                            size={18}
                            color={isDark ? "#FFFFFF" : "#000000"}
                          />
                        )}
                      </Pressable>
                    ))
                  )}
                </ScrollView>
              )}
            </View>

            <View style={styles.resetSection}>
              <Pressable
                style={[
                  styles.resetButton,
                  { borderColor: dynamicStyles.innerCard.borderColor },
                ]}
                onPress={() => reset()}
              >
                <Ionicons
                  name="refresh-outline"
                  size={16}
                  color={dynamicStyles.text.color}
                />
                <Text style={[styles.resetText, dynamicStyles.text]}>
                  Reset
                </Text>
              </Pressable>
              <Text style={[styles.resetSubtext, dynamicStyles.subtitle]}>
                {selectedUniversity
                  ? "Filtered to your university"
                  : "No filter applied"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.matchesSection}>
          <Text style={[styles.sectionTitle, dynamicStyles.text]}>
            Tarp AI Smart Matches
          </Text>
          <Text style={[styles.sectionSubtitle, dynamicStyles.subtitle]}>
            AI-powered connections with compatible students
          </Text>

          {isLoadingCategories ? (
            <View style={styles.cardsGrid}>
              {Array.from({ length: 8 }).map((_, i) => (
                <CategoryCardSkeleton key={i} />
              ))}
            </View>
          ) : (
            <View style={styles.cardsGrid}>
              {categories.map((category: Category) => {
                console.log("Icon name from API:", category.icon);
                console.log("Full category object:", category);

                return (
                  <Pressable
                    key={category.id}
                    style={[styles.card, dynamicStyles.card]}
                    onPress={() => {
                      router.push(`/matches/${category.id}`);
                    }}
                  >
                    <View
                      style={[
                        styles.iconCircle,
                        { backgroundColor: category.bgColor },
                      ]}
                    >
                      {(() => {
                        const IconComponent = getIconComponent(category.icon, category.name);
                        return (
                          <IconComponent
                            size={24}
                            color={category.iconColor}
                            strokeWidth={2}
                          />
                        );
                      })()}
                    </View>
                    <Text style={[styles.cardTitle, dynamicStyles.text]}>
                      {category.name}
                    </Text>
                    <Text style={[styles.cardSubtitle, dynamicStyles.subtitle]}>
                      {category.subtitle}
                    </Text>
                    <Animated.View
                      style={[
                        styles.matchesBadge,
                        dynamicStyles.matchesBadge,
                        {
                          opacity: category.matches > 0 ? pulseAnim : 1,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.matchesText, dynamicStyles.subtitle]}
                      >
                        {category.matches} matches
                      </Text>
                    </Animated.View>
                  </Pressable>
                );
              })}
            </View>
          )}

          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={[styles.sectionTitle, dynamicStyles.text]}>
                Recent Matches
              </Text>
              <Pressable onPress={() => setShowAllRecent(!showAllRecent)}>
                <Text style={[styles.viewAllText, dynamicStyles.subtitle]}>
                  {showAllRecent ? "Show Less" : "Show All"}
                </Text>
              </Pressable>
            </View>

            {isLoadingRecentMatches ? (
              <>
                {Array.from({ length: 3 }).map((_, i) => (
                  <RecentMatchSkeleton key={i} />
                ))}
              </>
            ) : recentMatchesData?.allMatches &&
              recentMatchesData.allMatches.length > 0 ? (
              recentMatchesData.allMatches
                .slice(
                  0,
                  showAllRecent ? recentMatchesData.allMatches.length : 7
                )
                .map((match, matchIndex) => (
                  <Pressable
                    key={`${match.id}-${match.categoryDetails.id}-${matchIndex}`}
                    style={[styles.recentCard, dynamicStyles.card]}
                    onPress={() =>
                      console.log(`Maps to ${match.categoryDetails.name}`)
                    }
                  >
                    <View
                      style={[
                        styles.recentIconCircle,
                        { backgroundColor: match.categoryDetails.bgColorHex },
                      ]}
                    >
                      {(() => {
                        const IconComponent = getIconComponent(
                          match.categoryDetails.icon
                        );
                        return (
                          <IconComponent
                            size={20}
                            color={match.categoryDetails.colorHex}
                            strokeWidth={2}
                          />
                        );
                      })()}
                    </View>
                    <View style={styles.recentContent}>
                      <Text style={[styles.recentTitle, dynamicStyles.text]}>
                        {match.matches.length} new matches in{" "}
                        {match.categoryDetails.name}
                      </Text>
                      <View style={styles.recentUsers}>
                        <View
                          style={{
                            position: "relative",
                            flexDirection: "row",
                            height: 25,
                            width:
                              match.members.length > 3
                                ? 60
                                : match.members.length * 15,
                          }}
                        >
                          {match.members.slice(0, 3).map((member, index) => (
                            <View
                              key={`${match.id}-${member.id}-${index}`}
                              style={[
                                styles.userAvatar,
                                dynamicStyles.avatarBorder,
                                {
                                  position: "absolute",
                                  left: index * 19,
                                  zIndex: 3 - index,
                                },
                              ]}
                            >
                              {member.bgUrl ? (
                                <Image
                                  source={{ uri: member.bgUrl }}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: 10,
                                  }}
                                />
                              ) : (
                                <Text style={styles.avatarText}>
                                  {member.fname[0]}
                                </Text>
                              )}
                            </View>
                          ))}
                        </View>
                        <Text style={[styles.usersText]}>
                          {match.members.length > 3
                            ? `+${match.members.length - 3} more`
                            : `${match.members.length} member${
                                match.members.length > 1 ? "s" : ""
                              }`}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.recentRight}>
                      <Text style={[styles.timeText, dynamicStyles.subtitle]}>
                        {moment(match.createdAt).fromNow()}
                      </Text>
                      <View style={[styles.percentageBadge]}>
                        <Text
                          style={[
                            styles.matchPercent,
                            {
                              color: "#FFFFFF",
                              backgroundColor: isDark ? "#b7bbc2" : "#b7bbc2",
                              borderRadius: 8,
                              paddingHorizontal: 7,
                              paddingVertical: 5,
                            },
                          ]}
                        >
                          {match.avgMatch}% avg match
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, dynamicStyles.subtitle]}>
                  No recent matches found
                </Text>
              </View>
            )}

            {isLoadingRecentMatches ? (
              <View
                style={[
                  styles.compatibilityCard,
                  dynamicStyles.compatibilityCard,
                ]}
              >
                <Skeleton width={24} height={24} borderRadius={12} />
                <View style={styles.compatibilityContent}>
                  <Skeleton
                    width="80%"
                    height={16}
                    style={{ marginBottom: 2 }}
                  />
                  <Skeleton width="60%" height={12} />
                </View>
              </View>
            ) : recentMatchesData?.matchSummary ? (
              <Pressable
                style={[
                  styles.compatibilityCard,
                  dynamicStyles.compatibilityCard,
                ]}
              >
                <View
                  style={[
                    styles.grayHeart,
                    { backgroundColor: isDark ? "#55575a" : "#e7e9ec" },
                  ]}
                >
                  <Ionicons name="heart-outline" size={24} color="#808080" />
                </View>
                <View style={styles.compatibilityContent}>
                  <Text style={[styles.compatibilityTitle, dynamicStyles.text]}>
                    🎉 You have {recentMatchesData.matchSummary.avgPercent}% avg
                    compatibility!
                  </Text>
                  <Text
                    style={[
                      styles.compatibilitySubtitle,
                      dynamicStyles.subtitle,
                    ]}
                  >
                    Higher than {recentMatchesData.matchSummary.relativePercent}
                    % of users
                  </Text>
                </View>
              </Pressable>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    fontFamily: "Geist-Regular",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  filterSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 10,
    fontWeight: "700",
    flex: 1,
  },
  realTimeBadge: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333333",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  realTimeText: {
    fontSize: 8,
    fontWeight: "500",
  },
  innerCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  universityLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  campusSelector: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  campusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
  },
  campusText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  resetSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderRadius: 8,
  },
  dashed: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 15,
    padding: 20,
  },
  resetText: {
    fontSize: 12,
    fontWeight: "700",
  },
  resetSubtext: {
    fontSize: 9,
  },
  matchesSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 10,
    marginBottom: 16,
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: "48%",
    display: "flex",
    flexDirection: "column",
    height: 230,
    borderRadius: 12,
    borderWidth: 0.5,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
  },
  cardSubtitle: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 15,
  },
  matchesText: {
    fontSize: 10,
    fontWeight: "500",
  },
  recentSection: {
    marginTop: 24,
    marginBottom: 0,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 10,
  },
  recentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  recentIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  recentContent: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  recentUsers: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  userAvatar: {
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: "#00D084",
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "700",
  },
  grayHeart: {
    borderRadius: 30,
    padding: 10,
  },
  usersText: {
    fontSize: 10,
    fontWeight: "700",
    marginLeft: 4,
    color: "#939393",
  },
  recentRight: {
    alignItems: "flex-end",
  },
  timeText: {
    fontSize: 10,
    marginBottom: 4,
  },
  matchPercent: {
    fontSize: 9,
    fontWeight: "700",
  },
  compatibilityCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginTop: 8,
  },
  compatibilityContent: {
    flex: 1,
  },
  compatibilityTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
  },
  compatibilitySubtitle: {
    fontSize: 12,
  },
  percentageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dropdown: {
    position: "absolute",
    top: 48,
    left: 40,
    right: 0,
    zIndex: 1000,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  matchesBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "center",
  },
  dropdownText: {
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
  },
});

export default Index;
