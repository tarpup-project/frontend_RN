// import { useTheme } from "@/app/contexts/ThemeContext";
// import Header from "@/components/Header";
// import { Text } from "@/components/Themedtext";
// import { Ionicons } from "@expo/vector-icons";
// import { router } from "expo-router";
// import { Pressable, ScrollView, StyleSheet, View } from "react-native";

// const Groups = () => {
//   const { isDark } = useTheme();

//   const dynamicStyles = {
//     container: {
//       backgroundColor: isDark ? "#000000" : "#FFFFFF",
//     },
//     text: {
//       color: isDark ? "#FFFFFF" : "#000000",
//     },
//     subtitle: {
//       color: isDark ? "#CCCCCC" : "#666666",
//     },
//     card: {
//       backgroundColor: isDark ? "#000000" : "#FFFFFF",
//       borderColor: isDark ? "#333333" : "#E0E0E0",
//     },
//     avatarBorder: {
//       borderColor: isDark ? "#000000" : "#FFFFFF",
//     },
//     openButton: {
//       backgroundColor: isDark ? "#FFFFFF" : "#000000",
//     },
//     openButtonText: {
//       color: isDark ? "#000000" : "#FFFFFF",
//     },
//     categoryBadge: {
//       backgroundColor: isDark ? "#FFFFFF" : "#000000",
//     },
//     categoryBadgeText: {
//       color: isDark ? "#000000" : "#FFFFFF",
//     },
//     matchBadge: {
//       backgroundColor: isDark? "#0A4D2E" : "#c3f3d5",
//     },
//     matchText: {
//       color: isDark ? "#FFFFFF" : "#000000",
//     },
//     unreadBadge: {
//       backgroundColor: isDark? "#532325" : "#f7cacf",
//     },
//     unreadText: {
//       color: isDark? "#FFFFFF" : "#000000"
//     }
//   };

//   const categoryColors: Record<string, { icon: string }> = {
//     Giveaway: { icon: "gift-outline" },
//     Rides: { icon: "car-outline" },
//     Study: { icon: "book-outline" },
//     Roommate: { icon: "home-outline" },
//     Sports: { icon: "basketball-outline" },
//     Events: { icon: "calendar-outline" },
//     Party: { icon: "musical-notes-outline" },
//     Dating: { icon: "heart-outline" },
//     Marketplace: { icon: "cart-outline" },
//   };

//   const groups = [
//     {
//       id: 1,
//       category: "Giveaway",
//       title: "Thermo Cup",
//       description: "Giving away a thermo cup at Louisiana Tech University.",
//       members: 2,
//       unreadCount: 0,
//       matchPercentage: "70%",
//       activeTime: "Active 15 hours ago",
//       avatarColors: ["#FF6B9D", "#4A90E2"],
//     },
//     {
//       id: 2,
//       category: "Rides",
//       title: "Downtown Ride Group",
//       description: "Regular rides to downtown Tampa for weekend activities",
//       members: 4,
//       unreadCount: 3,
//       matchPercentage: "92%",
//       activeTime: "Active 2 hours ago",
//       avatarColors: ["#FF6B9D", "#4A90E2", "#9C27B0"],
//     },
//     {
//       id: 3,
//       category: "Study",
//       title: "Organic Chemistry Study Circle",
//       description: "Weekly study sessions for Organic Chemistry",
//       members: 2,
//       unreadCount: 7,
//       matchPercentage: "88%",
//       activeTime: "Active 30 minutes ago",
//       avatarColors: ["#FF6B9D", "#4A90E2"],
//     },
//     {
//       id: 4,
//       category: "Roommate",
//       title: "Spring Housing Group",
//       description: "Found compatible roommates for spring semester",
//       members: 4,
//       unreadCount: 0,
//       matchPercentage: "95%",
//       activeTime: "Active 1 day ago",
//       avatarColors: ["#FF6B9D", "#4A90E2", "#9C27B0"],
//     },
//     {
//       id: 5,
//       category: "Sports",
//       title: "Friday Night Basketball",
//       description: "Weekly basketball games every Friday evening",
//       members: 8,
//       unreadCount: 2,
//       matchPercentage: "95%",
//       activeTime: "Active 3 hours ago",
//       avatarColors: ["#FF6B9D", "#4A90E2", "#9C27B0", "#00D084"],
//     },
//   ];

//   return (
//     <View style={[styles.container, dynamicStyles.container]}>
//       <Header />

//       <ScrollView style={styles.content}>
//         <View style={styles.headerSection}>
//           <Text style={[styles.pageTitle, dynamicStyles.text]}>Your Groups</Text>
//           <Text style={[styles.pageSubtitle, dynamicStyles.subtitle]}>
//             AI-matched groups you've joined
//           </Text>
//         </View>

//         <View style={styles.groupsList}>
//           {groups.map((group) => (
//             <View key={group.id} style={[styles.groupCard, dynamicStyles.card]}>
//               <View style={styles.topRow}>
//                 <View style={[styles.categoryBadge, dynamicStyles.categoryBadge]}>
//                   <Ionicons 
//                     name={(categoryColors[group.category]?.icon || "pricetag-outline") as any}
//                     size={12} 
//                     color="#d26925"
//                   />
//                   <Text style={[styles.categoryText, dynamicStyles.categoryBadgeText]}>
//                     {group.category}
//                   </Text>
//                 </View>

//                 <View style={[styles.matchBadge, dynamicStyles.matchBadge]}>
//                   <Ionicons name="star-outline" size={12} color={dynamicStyles.matchText.color} />
//                   <Text style={[styles.matchText, dynamicStyles.matchText]}>
//                     {group.matchPercentage} match
//                   </Text>
//                 </View>
//               </View>

//               <Text style={[styles.groupTitle, dynamicStyles.text]}>
//                 {group.category}: {group.title}
//               </Text>
//               <Text style={[styles.groupDescription, dynamicStyles.subtitle]}>
//                 {group.description}
//               </Text>

//               <View style={styles.membersRow}>
//                 <View style={styles.avatarsContainer}>
//                   {group.avatarColors.slice(0, 3).map((color, index) => (
//                     <View
//                       key={index}
//                       style={[
//                         styles.avatar,
//                         { backgroundColor: color },
//                         dynamicStyles.avatarBorder,
//                         index > 0 && { marginLeft: -8 },
//                       ]}
//                     >
//                       <Text style={styles.avatarText}>
//                         {String.fromCharCode(65 + index)}
//                       </Text>
//                     </View>
//                   ))}
//                   <Text style={[styles.membersText, dynamicStyles.subtitle]}>
//                     {group.members} members
//                   </Text>
//                 </View>
//               </View>

//               <View style={styles.footerRow}>
//                 <View style={styles.activeRow}>
//                   <Ionicons
//                     name="time-outline"
//                     size={14}
//                     color={dynamicStyles.subtitle.color}
//                   />
//                   <Text style={[styles.activeText, dynamicStyles.subtitle]}>
//                     {group.activeTime}
//                   </Text>
//                 </View>

//                 <View style={[styles.unreadBadge, dynamicStyles.unreadBadge]}>
//                   <Text style={[styles.unreadText, dynamicStyles.unreadText]}>{group.unreadCount} new messages</Text>
//                 </View>
//               </View>

//               <Pressable
//                 style={[styles.openButton, dynamicStyles.openButton]}
//                 onPress={() => router.push(`/group-chat/${group.id}`)}
//               >
//                 <Ionicons
//                   name="chatbubble-outline"
//                   size={16}
//                   color={dynamicStyles.openButtonText.color}
//                 />
//                 <Text
//                   style={[
//                     styles.openButtonText,
//                     dynamicStyles.openButtonText,
//                   ]}
//                 >
//                   Open Chat
//                 </Text>
//               </Pressable>
//             </View>
//           ))}
//         </View>
//       </ScrollView>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   content: {
//     flex: 1,
//     paddingHorizontal: 16,
//   },
//   headerSection: {
//     marginTop: 16,
//     marginBottom: 24,
//   },
//   pageTitle: {
//     fontSize: 15,
//     fontWeight: "bold",
//     marginBottom: 4,
//   },
//   pageSubtitle: {
//     fontSize: 14,
//   },
//   groupsList: {
//     gap: 16,
//     marginBottom: 50,
//   },
//   groupCard: {
//     padding: 16,
//     borderRadius: 12,
//     borderWidth: 1,
//     gap: 12,
//   },
//   topRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   categoryBadge: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     borderRadius: 6,
//   },
//   categoryText: {
//     fontSize: 11,
//     fontWeight: "600",
//   },
//   matchBadge: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     borderRadius: 12,
//   },
//   matchText: {
//     fontSize: 11,
//     fontWeight: "600",
//   },
//   groupTitle: {
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   groupDescription: {
//     fontSize: 12,
//     lineHeight: 20,
//   },
//   membersRow: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   avatarsContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   avatar: {
//     width: 28,
//     height: 28,
//     borderRadius: 14,
//     borderWidth: 2,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   avatarText: {
//     color: "#FFFFFF",
//     fontSize: 10,
//     fontWeight: "600",
//   },
//   membersText: {
//     fontSize: 13,
//     marginLeft: 8,
//   },
//   footerRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   activeRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//   },
//   activeText: {
//     fontSize: 10,
//   },
//   unreadBadge: {
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   unreadText: {
//     fontSize: 11,
//     fontWeight: "600",
//   },
//   openButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 8,
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderRadius: 20,
//     marginTop: 4,
//   },
//   openButtonText: {
//     fontSize: 12,
//     fontWeight: "600",
//   },
// });

// export default Groups;



import { useTheme } from "@/app/contexts/ThemeContext";
import Header from "@/components/Header";
import { Text } from "@/components/Themedtext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View, RefreshControl, ActivityIndicator, Image } from "react-native";
import { useGroups, transformGroupForUI } from "@/app/hooks/useGroups";
import { useCampus } from "@/app/hooks/useCampus";
import { useAuthStore } from "@/app/state/authStore";

const Groups = () => {
  const { isDark } = useTheme();
  const { data: groups, isLoading, isError, refetch, isRefetching } = useGroups();
  const { selectedCampus } = useCampus();
  const { user } = useAuthStore();

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#000000" : "#FFFFFF",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
    card: {
      backgroundColor: isDark ? "#000000" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    avatarBorder: {
      borderColor: isDark ? "#000000" : "#FFFFFF",
    },
    openButton: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000",
    },
    openButtonText: {
      color: isDark ? "#000000" : "#FFFFFF",
    },
    categoryBadge: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000",
    },
    categoryBadgeText: {
      color: isDark ? "#000000" : "#FFFFFF",
    },
    matchBadge: {
      backgroundColor: isDark? "#0A4D2E" : "#c3f3d5",
    },
    matchText: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    unreadBadge: {
      backgroundColor: isDark? "#532325" : "#f7cacf",
    },
    unreadText: {
      color: isDark? "#FFFFFF" : "#000000"
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <View style={[styles.container, dynamicStyles.container]}>
        <Header />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={isDark ? "#FFFFFF" : "#000000"} />
          <Text style={[styles.loadingText, dynamicStyles.text]}>Loading your groups...</Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (isError) {
    return (
      <View style={[styles.container, dynamicStyles.container]}>
        <Header />
        <View style={styles.centerContainer}>
          <Ionicons 
            name="alert-circle-outline" 
            size={48} 
            color={isDark ? "#FF6B6B" : "#E74C3C"} 
          />
          <Text style={[styles.errorText, dynamicStyles.text]}>Failed to load groups</Text>
          <Text style={[styles.errorSubtext, dynamicStyles.subtitle]}>
            Check your connection and try again
          </Text>
          <Pressable 
            style={[styles.retryButton, dynamicStyles.openButton]}
            onPress={() => refetch()}
          >
            <Text style={[styles.retryButtonText, dynamicStyles.openButtonText]}>
              Try Again
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Show empty state
  if (!groups || groups.length === 0) {
    return (
      <View style={[styles.container, dynamicStyles.container]}>
        <Header />
        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        >
          <View style={styles.headerSection}>
            <Text style={[styles.pageTitle, dynamicStyles.text]}>Your Groups</Text>
            <Text style={[styles.pageSubtitle, dynamicStyles.subtitle]}>
              AI-matched groups you've joined
            </Text>
          </View>
          
          <View style={styles.centerContainer}>
            <Ionicons 
              name="people-outline" 
              size={48} 
              color={dynamicStyles.subtitle.color} 
            />
            <Text style={[styles.emptyText, dynamicStyles.text]}>No groups yet</Text>
            <Text style={[styles.emptySubtext, dynamicStyles.subtitle]}>
              Join or create a group to get started
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Transform groups data for UI
  const transformedGroups = groups.map(transformGroupForUI);

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Header />

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        <View style={styles.headerSection}>
          <Text style={[styles.pageTitle, dynamicStyles.text]}>Your Groups</Text>
          <Text style={[styles.pageSubtitle, dynamicStyles.subtitle]}>
            AI-matched groups you've joined
            {selectedCampus && ` • ${selectedCampus.name}`}
          </Text>
        </View>

        <View style={styles.groupsList}>
          {transformedGroups.map((group) => (
            <View key={group.id} style={[styles.groupCard, dynamicStyles.card]}>
              <View style={styles.topRow}>
                <View style={[styles.categoryBadge, dynamicStyles.categoryBadge]}>
                  <Ionicons 
                    name={group.categoryIcon}
                    size={12} 
                    color="#d26925"
                  />
                  <Text style={[styles.categoryText, dynamicStyles.categoryBadgeText]}>
                    {group.category}
                  </Text>
                </View>

                <View style={[styles.matchBadge, dynamicStyles.matchBadge]}>
                  <Ionicons name="star-outline" size={12} color={dynamicStyles.matchText.color} />
                  <Text style={[styles.matchText, dynamicStyles.matchText]}>
                    {group.matchPercentage} match
                  </Text>
                </View>
              </View>

              <Text style={[styles.groupTitle, dynamicStyles.text]}>
                {group.title}
              </Text>
              <Text style={[styles.groupDescription, dynamicStyles.subtitle]}>
                {group.description}
              </Text>

              <View style={styles.membersRow}>
                <View style={styles.avatarsContainer}>
                  {/* Show member avatars or colored circles */}
                  {group.rawGroup.members.slice(0, 3).map((member, index) => (
                    <View
                      key={member.id}
                      style={[
                        styles.avatar,
                        { backgroundColor: member.bgUrl ? 'transparent' : group.avatarColors[index] },
                        dynamicStyles.avatarBorder,
                        index > 0 && { marginLeft: -8 },
                      ]}
                    >
                      {member.bgUrl ? (
                        <Image 
                          source={{ uri: member.bgUrl }} 
                          style={styles.avatarImage}
                        />
                      ) : (
                        <Text style={styles.avatarText}>
                          {member.fname[0].toUpperCase()}
                        </Text>
                      )}
                    </View>
                  ))}
                  <Text style={[styles.membersText, dynamicStyles.subtitle]}>
                    {group.members} {group.members === 1 ? 'member' : 'members'}
                  </Text>
                </View>
              </View>

              <View style={styles.footerRow}>
                <View style={styles.activeRow}>
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={dynamicStyles.subtitle.color}
                  />
                  <Text style={[styles.activeText, dynamicStyles.subtitle]}>
                    {group.activeTime}
                  </Text>
                </View>

                <View style={[styles.unreadBadge, dynamicStyles.unreadBadge]}>
                  <Text style={[styles.unreadText, dynamicStyles.unreadText]}>
                    {group.unreadCount} new messages
                  </Text>
                </View>
              </View>

              <Pressable
                style={[styles.openButton, dynamicStyles.openButton]}
                onPress={() => router.push(`/group-chat/${group.id}`)}
              >
                <Ionicons
                  name="chatbubble-outline"
                  size={16}
                  color={dynamicStyles.openButtonText.color}
                />
                <Text
                  style={[
                    styles.openButtonText,
                    dynamicStyles.openButtonText,
                  ]}
                >
                  Open Chat
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  headerSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
  },
  groupsList: {
    gap: 16,
    marginBottom: 50,
  },
  groupCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
  },
  matchBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  matchText: {
    fontSize: 11,
    fontWeight: "600",
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  groupDescription: {
    fontSize: 12,
    lineHeight: 20,
  },
  membersRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  membersText: {
    fontSize: 13,
    marginLeft: 8,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  activeText: {
    fontSize: 10,
  },
  unreadBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: "600",
  },
  openButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 4,
  },
  openButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  // Loading and error states
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
});

export default Groups;