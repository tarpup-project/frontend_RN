import { Text } from "@/components/Themedtext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Award,
  MessageSquare,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
  X,
} from "lucide-react-native";
import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";

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

interface UserLeaderboardInterface {
  totalActivities: number;
  totalPoints: number;
  pointMonthDiff: number;
  position: {
    rank: number;
    totalUsers: number;
  };
  createdPrompts: {
    count: number;
    weight: number;
    total: number;
  };
  successfulMatches: {
    count: number;
    weight: number;
    total: number;
  };
  referrals: {
    count: number;
    weight: number;
    total: number;
  };
  joinedGroups: {
    count: number;
    weight: number;
    total: number;
  };
}

interface LeaderBoardBreakDownProps {
  data: UserLeaderboardInterface;
  visible: boolean;
  onClose: () => void;
}

const LeaderBoardBreakDown: React.FC<LeaderBoardBreakDownProps> = ({
  data,
  visible,
  onClose,
}) => {
  const { isDark } = useTheme();

  const dynamicStyles = {
    modal: {
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
    iconBg: {
      backgroundColor: isDark ? "#1A1A1A" : "#F0F0F0",
    },
    totalCard: {
      backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, dynamicStyles.modal]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.trophyIcon, { backgroundColor: "#FF7B00" }]}>
              <Trophy size={20} color="#FFFFFF" />
            </View>
            <Text style={[styles.headerTitle, dynamicStyles.text]}>
              Your TarpAI Stats
            </Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <X size={20} color={dynamicStyles.subtitle.color} />
          </Pressable>
        </View>

        <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
          See how you earned your ranking and points on the leaderboard
        </Text>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, dynamicStyles.card]}>
            <Award color="#FF7B00" size={20} />
            <View style={styles.statInfo}>
              <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
                Rank
              </Text>
              <Text style={[styles.statValue, dynamicStyles.text]}>
                #{numberToStandard(data.position.rank)}
                <Text style={[styles.statTotal, dynamicStyles.subtitle]}>
                  {" "}
                  / {numberToStandard(data.position.totalUsers)}
                </Text>
              </Text>
            </View>
          </View>

          <View style={[styles.statCard, dynamicStyles.card]}>
            <TrendingUp color={dynamicStyles.text.color} size={20} />
            <View style={styles.statInfo}>
              <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
                Points
              </Text>
              <Text style={[styles.statValue, dynamicStyles.text]}>
                {numberToSocial(data.totalPoints)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <ScrollView
          style={styles.breakdown}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.breakdownHeader}>
            <Text style={[styles.breakdownTitle, dynamicStyles.subtitle]}>
              Points Breakdown
            </Text>
            <View style={[styles.activitiesBadge, dynamicStyles.card]}>
              <Text style={[styles.activitiesText, dynamicStyles.text]}>
                {data.totalActivities} activities
              </Text>
            </View>
          </View>

          <View style={styles.activityList}>
            <View style={[styles.activityCard, dynamicStyles.card]}>
              <View style={styles.activityLeft}>
                <View style={[styles.activityIcon, dynamicStyles.iconBg]}>
                  <UserPlus size={17} color={dynamicStyles.text.color} />
                </View>
                <View style={styles.activityInfo}>
                  <View style={styles.activityTitleRow}>
                    <Text style={[styles.activityTitle, dynamicStyles.text]}>
                      Referrals
                    </Text>
                    <View style={[styles.countBadge, dynamicStyles.iconBg]}>
                      <Text style={[styles.countText, dynamicStyles.text]}>
                        {numberToStandard(data.referrals.count)}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.activityWeight, dynamicStyles.subtitle]}>
                    {numberToStandard(data.referrals.weight)} pts per action
                  </Text>
                  <Text style={[styles.activityDesc, dynamicStyles.subtitle]}>
                    Friends you invited to TarpAI
                  </Text>
                </View>
              </View>
              <Text style={[styles.activityPoints, dynamicStyles.text]}>
                +{numberToSocial(data.referrals.total)}
              </Text>
            </View>

            <View style={[styles.activityCard, dynamicStyles.card]}>
              <View style={styles.activityLeft}>
                <View style={[styles.activityIcon, dynamicStyles.iconBg]}>
                  <MessageSquare size={17} color={dynamicStyles.text.color} />
                </View>
                <View style={styles.activityInfo}>
                  <View style={styles.activityTitleRow}>
                    <Text style={[styles.activityTitle, dynamicStyles.text]}>
                      Prompts Created
                    </Text>
                    <View style={[styles.countBadge, dynamicStyles.iconBg]}>
                      <Text style={[styles.countText, dynamicStyles.text]}>
                        {numberToStandard(data.createdPrompts.count)}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.activityWeight, dynamicStyles.subtitle]}>
                    {numberToStandard(data.createdPrompts.weight)} pts per
                    action
                  </Text>
                  <Text style={[styles.activityDesc, dynamicStyles.subtitle]}>
                    AI matching requests you submitted
                  </Text>
                </View>
              </View>
              <Text style={[styles.activityPoints, dynamicStyles.text]}>
                +{numberToSocial(data.createdPrompts.total)}
              </Text>
            </View>

            <View style={[styles.activityCard, dynamicStyles.card]}>
              <View style={styles.activityLeft}>
                <View style={[styles.activityIcon, dynamicStyles.iconBg]}>
                  <Target size={17} color={dynamicStyles.text.color} />
                </View>
                <View style={styles.activityInfo}>
                  <View style={styles.activityTitleRow}>
                    <Text style={[styles.activityTitle, dynamicStyles.text]}>
                      Successful Matches
                    </Text>
                    <View style={[styles.countBadge, dynamicStyles.iconBg]}>
                      <Text style={[styles.countText, dynamicStyles.text]}>
                        {numberToStandard(data.successfulMatches.count)}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.activityWeight, dynamicStyles.subtitle]}>
                    {numberToStandard(data.successfulMatches.weight)} pts per
                    action
                  </Text>
                  <Text style={[styles.activityDesc, dynamicStyles.subtitle]}>
                    Groups where matches were confirmed
                  </Text>
                </View>
              </View>
              <Text style={[styles.activityPoints, dynamicStyles.text]}>
                +{numberToSocial(data.successfulMatches.total)}
              </Text>
            </View>

            <View style={[styles.activityCard, dynamicStyles.card]}>
              <View style={styles.activityLeft}>
                <View style={[styles.activityIcon, dynamicStyles.iconBg]}>
                  <Users size={17} color={dynamicStyles.text.color} />
                </View>
                <View style={styles.activityInfo}>
                  <View style={styles.activityTitleRow}>
                    <Text style={[styles.activityTitle, dynamicStyles.text]}>
                      Joined Groups
                    </Text>
                    <View style={[styles.countBadge, dynamicStyles.iconBg]}>
                      <Text style={[styles.countText, dynamicStyles.text]}>
                        {numberToStandard(data.joinedGroups.count)}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.activityWeight, dynamicStyles.subtitle]}>
                    {numberToStandard(data.joinedGroups.weight)} pts per action
                  </Text>
                  <Text style={[styles.activityDesc, dynamicStyles.subtitle]}>
                    Other people's prompts you joined
                  </Text>
                </View>
              </View>
              <Text style={[styles.activityPoints, dynamicStyles.text]}>
                +{numberToSocial(data.joinedGroups.total)}
              </Text>
            </View>
          </View>

          <View style={[styles.totalCard, dynamicStyles.totalCard]}>
            <View style={styles.totalLeft}>
              <View style={styles.totalTitleRow}>
                <Sparkles size={13} color={dynamicStyles.text.color} />
                <Text style={[styles.totalTitle, dynamicStyles.text]}>
                  Total Earned
                </Text>
              </View>
              {data.pointMonthDiff > 0 && (
                <Text style={[styles.monthProgress, dynamicStyles.subtitle]}>
                  Keep it up! +{numberToSocial(data.pointMonthDiff)} this month
                </Text>
              )}
            </View>
            <View style={styles.totalRight}>
              <Text style={[styles.totalPoints, dynamicStyles.text]}>
                {numberToSocial(data.totalPoints)}
              </Text>
              <Text style={[styles.totalLabel, dynamicStyles.subtitle]}>
                points
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  trophyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    padding: 8,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  statTotal: {
    fontWeight: "400",
  },
  divider: {
    height: 1,
    backgroundColor: "#404040",
    marginBottom: 16,
  },
  breakdown: {
    flex: 1,
  },
  breakdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 13,
  },
  activitiesBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 8,
  },
  activitiesText: {
    fontSize: 10,
    fontWeight: "500",
  },
  activityList: {
    gap: 12,
  },
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  activityLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  activityIcon: {
    width: 30,
    height: 30,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  activityInfo: {
    flex: 1,
  },
  activityTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  countText: {
    fontSize: 11,
    fontWeight: "500",
  },
  activityWeight: {
    fontSize: 11,
    marginBottom: 1,
  },
  activityDesc: {
    fontSize: 11,
  },
  activityPoints: {
    fontSize: 14,
    fontWeight: "600",
  },
  totalCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: "dashed",
    marginTop: 16,
    marginBottom: 40,
  },
  totalLeft: {
    flex: 1,
  },
  totalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  totalTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  monthProgress: {
    fontSize: 12,
  },
  totalRight: {
    alignItems: "flex-end",
  },
  totalPoints: {
    fontSize: 16,
    fontWeight: "600",
  },
  totalLabel: {
    fontSize: 10,
    marginTop: 2,
  },
});

export default LeaderBoardBreakDown;
