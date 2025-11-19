import { Skeleton } from "@/components/Skeleton";
import { Text } from "@/components/Themedtext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { UserLeaderboardInterface } from "@/types/leaderboard";
import {
  ChevronRight,
  Sparkles,
  TrendingUp,
  Trophy,
} from "lucide-react-native";
import React, { useState } from "react";
import LeaderBoardBreakDown from "./Leaderboardbreakdown";
import { Pressable, StyleSheet, View } from "react-native";

const numberToSocial = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

const numberToStandard = (num: number): string => {
  return num.toLocaleString();
};

const LeaderBoard = () => {
  const { isDark } = useTheme();
  const { data, isLoading, error } = useLeaderboard();
  const [showBreakdown, setShowBreakdown] = useState(false);

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#0a0a0a",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
    badge: {
      backgroundColor: isDark ? "#1A1A1A" : "#F0F0F0",
    },
  };

  const handlePress = () => {
    setShowBreakdown(true);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, dynamicStyles.container]}>
        <View style={styles.content}>
          <View style={styles.leftSection}>
            <View style={[styles.trophyIcon, { backgroundColor: "#FF7B00" }]}>
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
          <View style={styles.rightSection}>
            <View style={styles.pointsContainer}>
              <Skeleton width={60} height={24} />
              <Skeleton width={40} height={10} style={{ marginTop: 2 }} />
            </View>
            <ChevronRight size={18} color={dynamicStyles.subtitle.color} />
          </View>
        </View>
      </View>
    );
  }

  if (error || !data) {
    return null;
  }

  const leaderboardData = data as UserLeaderboardInterface;

  return (
    <>
    <Pressable
      style={[styles.container, dynamicStyles.container]}
      onPress={handlePress}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View style={[styles.trophyIcon, { backgroundColor: "#FF7B00" }]}>
            <Trophy size={20} color="#FFFFFF" />
          </View>
          <View style={styles.rankingInfo}>
            <View style={styles.rankRow}>
              <Text style={[styles.rankText, dynamicStyles.text]}>
                #{numberToStandard(leaderboardData.position.rank)}
                <Text style={[styles.rankTotal, dynamicStyles.subtitle]}>
                  {" "}
                  / {numberToStandard(leaderboardData.position.totalUsers)}
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

        <View style={styles.rightSection}>
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
    <LeaderBoardBreakDown
    data={leaderboardData}
    visible={showBreakdown}
    onClose={() => setShowBreakdown(false)}
    </>
  />

  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginHorizontal: 0,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  trophyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  rankingInfo: {
    flex: 1,
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  rankText: {
    fontSize: 15,
    fontWeight: "700",
  },
  rankTotal: {
    fontSize: 15,
    fontWeight: "700",
  },
  risingStarBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  rankingSubtitle: {
    fontSize: 10,
    marginTop: 2,
    marginBottom: 20,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pointsContainer: {
    alignItems: "flex-end",
  },
  pointsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pointsText: {
    fontSize: 18,
    fontWeight: "700",
  },
  pointsLabel: {
    fontSize: 10,
    marginTop: 2,
  },
});

export default LeaderBoard;
