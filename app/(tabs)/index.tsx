import { useTheme } from "@/app/contexts/ThemeContext";
import Header from "@/components/Header";
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
  Trophy,
  TrendingUp,
  Sparkles,
  ChevronRight,
} from "lucide-react-native";
import moment from "moment";
import { useState, useEffect } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";



interface LeaderboardData {
  position: {
    rank: number;
    totalUsers: number;
  };
  totalPoints: number;
  pointMonthDiff?: number;
  totalActivities?: number;

}

const numberToSocial = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

const numberToStandard = (num: number): string => {
  return num.toLocaleString();
};

const getIconComponent = (iconName: string) => {
  const iconMap: { [key: string]: any } = {
    Car: Car,
    Home: Home,
    ShoppingBag: ShoppingBag,
    Gamepad2: Gamepad2,
    Heart: Heart,
    BookOpen: BookOpen,
    Gift: Gift,
    PartyPopper: PartyPopper,
    car: Car,
    book: BookOpen,
    gift: Gift,
    party: PartyPopper,
  };
  return iconMap[iconName] || Car;
};

const LeaderBoard = () => {
  const { isDark } = useTheme();
  const { user } = useAuthStore();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchLeaderboardData();
    }
  }, [user?.id]);

  const fetchLeaderboardData = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`https://server.tarpup.com/analytics/user/${user.id}`);
      const data = await response.json();
      setLeaderboardData(data.data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
    badge: {
      backgroundColor: isDark ? "#1A1A1A" : "#F0F0F0",
    },
  };

  if (!leaderboardData || isLoading) {
    return (
      <View style={[styles.leaderboardContainer, dynamicStyles.container]}>
        <View style={styles.leaderboardContent}>
          <View style={styles.leaderboardLeft}>
            <View style={[styles.trophyIcon, { backgroundColor: '#FF7B00' }]}>
              <Trophy size={20} color="#FFFFFF" />
            </View>
            <View style={styles.rankingInfo}>
              <View style={styles.rankRow}>
                <Skeleton width={60} height={20} style={{ marginRight: 8 }} />
                <Skeleton width={80} height={16} />
              </View>
              <Skeleton width={120} height={12} style={{ marginTop: 4 }} />
            </View>
          </View>
          <View style={styles.leaderboardRight}>
            <Skeleton width={60} height={24} />
            <ChevronRight size={18} color={dynamicStyles.subtitle.color} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <Pressable style={[styles.leaderboardContainer, dynamicStyles.container]}>
      <View style={styles.leaderboardContent}>
        <View style={styles.leaderboardLeft}>
          <View style={[styles.trophyIcon, { backgroundColor: '#FF7B00' }]}>
            <Trophy size={20} color="#FFFFFF" />
          </View>
          <View style={styles.rankingInfo}>
            <View style={styles.rankRow}>
              <Text style={[styles.rankText, dynamicStyles.text]}>
                #{numberToStandard(leaderboardData.position.rank)}
                <Text style={[styles.rankTotal, dynamicStyles.subtitle]}>
                  {' '}/ {numberToStandard(leaderboardData.position.totalUsers)}
                </Text>
              </Text>
              <View style={[styles.risingStarBadge, dynamicStyles.badge]}>
                <Sparkles size={12} color={dynamicStyles.text.color} />
                <Text style={[styles.badgeText, dynamicStyles.text]}>
                  Rising Star
                </Text>
              </View>
            </View>
            <Text style={[styles.rankingSubtitle, dynamicStyles.subtitle]}>
              Your TarpAI ranking
            </Text>
          </View>
        </View>
        <View style={styles.leaderboardRight}>
          <View style={styles.pointsContainer}>
            <View style={styles.pointsRow}>
              <TrendingUp size={18} color={dynamicStyles.text.color} />
              <Text style={[styles.pointsText, dynamicStyles.text]}>
                {numberToSocial(leaderboardData.totalPoints)}
              </Text>
            </View>
            <Text style={[styles.pointsLabel, dynamicStyles.subtitle]}>
              Points
            </Text>
          </View>
          <ChevronRight size={18} color={dynamicStyles.subtitle.color} />
        </View>
      </View>
    </Pressable>
  );
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
      backgroundColor: isDark ? "#1A1A1A" : "#E0E0E0",
    },
    percentageBadge: {
      backgroundColor: isDark ? "#0a0a0a" : "#E5E5E5",
    },
    percentageText: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    avatarBorder: {
      borderColor: isDark ? "#000000" : "#FFFFFF",
    },
    compatibilityCard: {
      backgroundColor: isDark ? "#0a0a0a" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Header />

      <ScrollView style={styles.content}>
        {isAuthenticated && <LeaderBoard />}

        {!isAuthenticated && (
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
                          <Text
                            style={[
                              { fontSize: 12, marginTop: 2 },
                              dynamicStyles.subtitle,
                            ]}
                          >
                            {uni.city}, {uni.state}
                          </Text>
                        </View>
                        {selectedUniversity?.id === uni.id && (
                          <Ionicons
                            name="checkmark"
                            size={18}
                            color="#00D084"
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
            AI-powered connections with students
          </Text>

          {isLoadingCategories ? (
            <View style={styles.cardsGrid}>
              {Array.from({ length: 8 }).map((_, i) => (
                <CategoryCardSkeleton key={i} />
              ))}
            </View>
          ) : (
            <View style={styles.cardsGrid}>
              {categories.map((category: Category) => (
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
                      const IconComponent = getIconComponent(category.icon);
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
                  <View
                    style={[styles.matchesBadge, dynamicStyles.matchesBadge]}
                  >
                    <Text style={[styles.matchesText, dynamicStyles.subtitle]}>
                      {category.matches} matches
                    </Text>
                  </View>
                </Pressable>
              ))}
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
                  showAllRecent ? recentMatchesData.allMatches.length : 3
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
                                ? 75
                                : match.members.length * 25,
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
                                  left: index * 20,
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
                        <Text
                          style={[styles.usersText, dynamicStyles.subtitle]}
                        >
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
                      <View
                        style={[
                          styles.percentageBadge,
                          dynamicStyles.percentageBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.matchPercent,
                            dynamicStyles.percentageText,
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
                <Ionicons
                  name="heart-outline"
                  size={24}
                  color={dynamicStyles.text.color}
                />
                <View style={styles.compatibilityContent}>
                  <Text style={[styles.compatibilityTitle, dynamicStyles.text]}>
                    🎉 {recentMatchesData.matchSummary.avgPercent}% avg
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
  leaderboardContainer: {
    marginTop: 16,
    marginHorizontal: -16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  leaderboardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  trophyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankingInfo: {
    flex: 1,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rankText: {
    fontSize: 17,
    fontWeight: '600',
  },
  rankTotal: {
    fontSize: 17,
    fontWeight: '400',
  },
  risingStarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  rankingSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  leaderboardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    fontSize: 20,
    fontWeight: '600',
  },
  pointsLabel: {
    fontSize: 10,
    marginTop: 2,
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
    fontSize: 12,
    fontWeight: "600",
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
    fontSize: 10,
    fontWeight: "500",
  },
  innerCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  universityLabel: {
    fontSize: 13,
    fontWeight: "600",
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
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
  },
  campusText: {
    flex: 1,
    fontSize: 14,
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
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 8,
  },
  dashed: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 15,
    padding: 12,
  },
  resetText: {
    fontSize: 12,
    fontWeight: "600",
  },
  resetSubtext: {
    fontSize: 11,
  },
  matchesSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
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
    height: 250,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
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
    fontSize: 14,
  },
  recentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
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
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  recentUsers: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  userAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#9C27B0",
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "600",
  },
  usersText: {
    fontSize: 12,
    marginLeft: 4,
  },
  recentRight: {
    alignItems: "flex-end",
  },
  timeText: {
    fontSize: 12,
    marginBottom: 4,
  },
  matchPercent: {
    fontSize: 14,
    fontWeight: "600",
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
    fontSize: 14,
    fontWeight: "600",
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
    borderRadius: 12,
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