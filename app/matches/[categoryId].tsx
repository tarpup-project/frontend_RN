// import { useTheme } from "@/app/contexts/ThemeContext";
// import Header from "@/components/Header";
// import PreviewModeBanner from "@/components/PreviewModeBanner";
// import { Text } from "@/components/Themedtext";
// import { Ionicons } from "@expo/vector-icons";
// import { router, useLocalSearchParams } from "expo-router";
// import {
//   BookOpen,
//   Car,
//   Gamepad2,
//   Gift,
//   Zap,
//   Heart,
//   Home,
//   PartyPopper,
//   ShoppingBag,
// } from "lucide-react-native";
// import { Pressable, ScrollView, StyleSheet, View } from "react-native";

// const CategoryMatches = () => {
//   const { categoryId } = useLocalSearchParams();
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
//     badge: {
//       backgroundColor: isDark ? "#1a1a1a" : "#f0f0f0",
//     },
//   };

//   const categoryMap: any = {
//     "1": {
//       name: "Rides",
//       icon: Car,
//       color: "#eff6ff",
//       iconColor: "#3b82f6",
//     },
//     "2": {
//       name: "Roommates",
//       icon: Home,
//       color: "#D5F5E3",
//       iconColor: "#10b981",
//     },
//     "3": {
//       name: "Marketplace",
//       icon: ShoppingBag,
//       color: "#faf5ff",
//       iconColor: "#a275fa",
//     },
//     "4": {
//       name: "Sports and Games",
//       icon: Gamepad2,
//       color: "#fff7ed",
//       iconColor: "#f3917c",
//     },
//     "5": {
//       name: "Dating",
//       icon: Heart,
//       color: "#fcf2f8",
//       iconColor: "#f3917c",
//     },
//     "6": {
//       name: "Study Groups",
//       icon: BookOpen,
//       color: "#eef2fe",
//       iconColor: "#f3917c",
//     },
//     "7": {
//       name: "Giveaways",
//       icon: Gift,
//       color: "#f0fdfa",
//       iconColor: "#55ab9f",
//     },
//     "8": {
//       name: "Party",
//       icon: PartyPopper,
//       color: "#ebfcf5",
//       iconColor: "#55ab9f",
//     },
//   };

//   const category = categoryMap[categoryId as string];
//   const IconComponent = category?.icon;

//   const matches = [
//     {
//       id: 1,
//       name: "John",
//       partner: "James",
//       destination: "Shreveport",
//       time: "2 minutes ago",
//       isNew: true,
//     },
//     {
//       id: 2,
//       name: "Sarah",
//       partner: "Lisa",
//       destination: "Baton Rouge",
//       time: "8 minutes ago",
//       isNew: false,
//     },
//     {
//       id: 3,
//       name: "Mike",
//       partner: "David",
//       destination: "New Orleans",
//       time: "15 minutes ago",
//       isNew: false,
//     },
//     {
//       id: 4,
//       name: "Anna",
//       partner: "Emma",
//       destination: "Lafayette",
//       time: "2h minutes ago",
//       isNew: false,
//     },
//     {
//       id: 5,
//       name: "Chris",
//       partner: "Alex",
//       destination: "Monroe",
//       time: "3h minutes ago",
//       isNew: false,
//     },
//     {
//       id: 6,
//       name: "Jessica",
//       partner: "Kevin",
//       destination: "Alexandria",
//       time: "5h minutes ago",
//       isNew: false,
//     },
//   ];

//   return (
//     <View style={[styles.container, dynamicStyles.container]}>
//       <View style={{ gap: 12 }}>
//         <Header />
//         <PreviewModeBanner />
//       </View>
//       {/* Header */}
//       <View style={styles.header}>
//         <Pressable onPress={() => router.back()} style={styles.backButton}>
//           <Ionicons
//             name="arrow-back"
//             size={24}
//             color={dynamicStyles.text.color}
//           />
//           <Text style={[styles.backText, dynamicStyles.text]}>Back</Text>
//         </Pressable>
//       </View>

//       {/* Category Title */}
//       <View style={styles.titleSection}>
//         <View style={styles.titleContent}>
//           <Text style={[styles.categoryTitle, dynamicStyles.text]}>
//             {category?.name}
//           </Text>
//           <Text style={[styles.matchCount, dynamicStyles.subtitle]}>
//             {matches.length} recent matches
//           </Text>
//         </View>
//       </View>

//       {/* Matches List */}
//       <ScrollView style={styles.matchesList}>
//         {matches.map((match) => (
//           <Pressable
//             key={match.id}
//             style={[styles.matchCard, dynamicStyles.card]}
//             onPress={() => console.log(`Navigate to match ${match.id}`)}
//           >
//             <View style={styles.matchHeader}>
//               <View style={styles.namesRow}>
//                 <Text style={[styles.matchName, dynamicStyles.text]}>
//                   {match.name}
//                 </Text>
//                 <Zap color="#008000" size={12} />
//                 <Text style={[styles.matchName, dynamicStyles.text]}>
//                   {match.partner}
//                 </Text>
//                 {match.isNew && (
//                   <View style={styles.newBadge}>
//                     <Text style={styles.newBadgeText}>NEW</Text>
//                   </View>
//                 )}
//               </View>
//             </View>
//             <View style={styles.matchDetails}>
//               <Ionicons
//                 name="location-outline"
//                 size={14}
//                 color={dynamicStyles.subtitle.color}
//               />
//               <Text style={[styles.destination, dynamicStyles.text]}>
//                 to {match.destination}
//               </Text>
//             </View>
//             <View style={styles.matchFooter}>
//               <Ionicons
//                 name="time-outline"
//                 size={14}
//                 color={dynamicStyles.subtitle.color}
//               />
//               <Text style={[styles.timeText, dynamicStyles.subtitle]}>
//                 {match.time}
//               </Text>
//             </View>
//           </Pressable>
//         ))}
//       </ScrollView>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   header: {
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//   },
//   backButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//   },
//   backText: {
//     fontSize: 16,
//   },
//   titleSection: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 16,
//     paddingVertical: 16,
//     gap: 12,
//   },
//   categoryIcon: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   titleContent: {
//     flex: 1,
//   },
//   categoryTitle: {
//     fontSize: 24,
//     fontWeight: "bold",
//     marginBottom: 4,
//   },
//   matchCount: {
//     fontSize: 14,
//   },
//   matchesList: {
//     flex: 1,
//     paddingHorizontal: 16,
//   },
//   matchCard: {
//     padding: 16,
//     borderRadius: 12,
//     borderWidth: 1,
//     marginBottom: 12,
//     gap: 8,
//   },
//   matchHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   namesRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//   },
//   matchName: {
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   newBadge: {
//     backgroundColor: "#f3917c",
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 6,
//   },
//   newBadgeText: {
//     color: "#FFFFFF",
//     fontSize: 10,
//     fontWeight: "bold",
//   },
//   matchDetails: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//   },
//   destination: {
//     fontSize: 14,
//   },
//   matchFooter: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//   },
//   timeText: {
//     fontSize: 12,
//   },
// });

// export default CategoryMatches;




import { useTheme } from "@/app/contexts/ThemeContext";
import Header from "@/components/Header";
import PreviewModeBanner from "@/components/PreviewModeBanner";
import { Skeleton } from "@/components/Skeleton";
import { Text } from "@/components/Themedtext";
import { useCampus } from "@/hooks/useCampus";
import { useCategories } from "@/hooks/useCategories";
import { useAuthStore } from "@/state/authStore";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { UrlConstants } from '@/constants/apiUrls';
import {
  Clock,
  Zap,
} from "lucide-react-native";
import moment from "moment";
import { useEffect, useRef } from "react";
import { 
  Animated,
  Pressable, 
  ScrollView, 
  StyleSheet, 
  View 
} from "react-native";

// CategoryMatches API Hook
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
    queryKey: ['categoryMatches', categoryId, campusId],
    queryFn: async () => {
      const response = await axios.get<{
        status: string;
        data: CategoryMatch[];
      }>(`${UrlConstants.baseUrl}${UrlConstants.fetchCategoryMatches(categoryId, campusId || '')}`);
      
      return response.data.data;
    },
    enabled: !!categoryId && !!campusId,
    staleTime: 30 * 1000,
    retry: 2,
  });
};

// Loading Skeleton Component
const MatchCardSkeleton = () => {
  const { isDark } = useTheme();
  
  return (
    <View
      style={[
        styles.matchCard,
        {
          backgroundColor: isDark ? "#000000" : "#FFFFFF",
          borderColor: isDark ? "#333333" : "#E0E0E0",
        },
      ]}
    >
      <View style={styles.matchHeader}>
        <View style={styles.namesRow}>
          <Skeleton width={60} height={16} style={{ marginRight: 8 }} />
          <Skeleton width={12} height={12} borderRadius={6} style={{ marginRight: 8 }} />
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

// Animated Match Card Component
const AnimatedMatchCard = ({ match, index, dynamicStyles }: { 
  match: CategoryMatch; 
  index: number;
  dynamicStyles: any;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Staggered animation entry
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 150, // Stagger by 150ms
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
        <View style={styles.matchHeader}>
          <View style={styles.namesRow}>
            <Text style={[styles.matchName, dynamicStyles.text]}>
              {match.members[0]?.user.fname || "User"}
            </Text>
            <Zap color="#00D084" size={16} />
            <Text style={[styles.matchName, dynamicStyles.text]}>
              {match.members[1]?.user.fname || "Partner"}
            </Text>
          </View>
        </View>
        
        <Text style={[styles.matchDescription, dynamicStyles.text]}>
          for {match.request?.title || match.group?.name || "Connection"}
        </Text>

        <View style={styles.matchFooter}>
          <Clock size={14} color={dynamicStyles.subtitle.color} />
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
  
  // Get category details from the categories data
  const category = categories?.find((cat: any) => cat.id === categoryId);
  
  // Fetch matches for this category
  const { 
    data: matches, 
    isLoading: isLoadingMatches,
    error 
  } = useCategoryMatches(
    categoryId as string, 
    selectedUniversity?.id
  );

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
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header and Preview Banner in ScrollView */}
        <View style={{ gap: 12 }}>
          <Header />
          {!isAuthenticated && <PreviewModeBanner />}
        </View>

        {/* Back Navigation */}
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

        {/* Category Title */}
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

        {/* Matches List */}
        <View style={styles.matchesList}>
          {isLoadingMatches ? (
            // Loading State
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <MatchCardSkeleton key={i} />
              ))}
            </>
          ) : error ? (
            // Error State
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, dynamicStyles.subtitle]}>
                Failed to load matches. Please try again.
              </Text>
            </View>
          ) : matches && matches.length > 0 ? (
            // Success State with Animation
            matches.map((match, index) => (
              <AnimatedMatchCard
                key={match.id}
                match={match}
                index={index}
                dynamicStyles={dynamicStyles}
              />
            ))
          ) : (
            // Empty State
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
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backText: {
    fontSize: 16,
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
    fontSize: 24,
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
  matchName: {
    fontSize: 16,
    fontWeight: "600",
  },
  matchDescription: {
    fontSize: 14,
    opacity: 0.8,
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