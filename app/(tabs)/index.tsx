// import { useTheme } from "@/app/contexts/ThemeContext";
// import Header from "@/components/Header";
// import PreviewModeBanner from "@/components/PreviewModeBanner";
// import { Text } from "@/components/Themedtext";
// import { useAuthStore } from "@/state/authStore";
// import { useCampus } from '@/hooks/useCampus';
// import { useCategories } from '@/hooks/useCategories';
// import { University } from "@/types/auth";
// import { Ionicons } from "@expo/vector-icons";
// import { router } from "expo-router";
// import {
//   BookOpen,
//   Car,
//   Gamepad2,
//   Gift,
//   Heart,
//   Home,
//   PartyPopper,
//   ShoppingBag,
// } from "lucide-react-native";
// import { useEffect, useState } from "react";
// import { Pressable, ScrollView, StyleSheet, View } from "react-native";



// const Index = () => {
//   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//   const [showAllRecent, setShowAllRecent] = useState(false);

//   const { isDark } = useTheme();
//   const { isAuthenticated } = useAuthStore();
//   const { selectedUniversity, setSelectedUniversity, reset } = useCampus();
// const { data: categories = [], isLoading } = useCategories(selectedUniversity?.id);
//   console.log(isAuthenticated);

//   useEffect(() => {
//     fetchUniversities();
//   }, []);
  
//   useEffect(() => {
//     fetchCategories(selectedUniversity?.id);
//   }, [selectedUniversity]);

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
//     filterContainer: {
//       backgroundColor: isDark ? "#000000" : "#FFFFFF",
//       borderColor: isDark ? "#333333" : "#E0E0E0",
//     },
//     innerCard: {
//       backgroundColor: isDark ? "#000000" : "#FFFFFF",
//       borderColor: isDark ? "#333333" : "#E0E0E0",
//     },
//     card: {
//       backgroundColor: isDark ? "#000000" : "#FFFFFF",
//       borderColor: isDark ? "#333333" : "#E0E0E0",
//     },
//     matchesBadge: {
//       backgroundColor: isDark ? "#1A1A1A" : "#E0E0E0",
//     },
//     percentageBadge: {
//       backgroundColor: isDark ? "#0A0A0A" : "#E5E5E5",
//     },
//     percentageText: {
//       color: isDark ? "#FFFFFF" : "#000000",
//     },
//     avatarBorder: {
//       borderColor: isDark ? "#000000" : "#FFFFFF",
//     },
//     compatibilityCard: {
//       backgroundColor: isDark ? "#0A0A0A" : "#F5F5F5",
//       borderColor: isDark ? "#333333" : "#E0E0E0",
//     },
//   };


//   return (
//     <View style={[styles.container, dynamicStyles.container]}>
//       <View style={{ gap: 12 }}>
//         <Header />
//         {!isAuthenticated && <PreviewModeBanner />}
//       </View>

//       <ScrollView style={styles.content}>
//         {/* Filter Campus Section */}
//         <View
//           style={[
//             styles.filterSection,
//             styles.dashed,
//             dynamicStyles.filterContainer,
//           ]}
//         >
//           <View style={styles.filterHeader}>
//             <Ionicons
//               name="funnel-outline"
//               size={16}
//               color={dynamicStyles.text.color}
//             />
//             <Text style={[styles.filterTitle, dynamicStyles.text]}>
//               Filter Campus Needs
//             </Text>

//             <View style={styles.realTimeBadge}>
//               <Text style={[styles.realTimeText, dynamicStyles.text]}>
//                 Real-Time
//               </Text>
//             </View>
//           </View>

//           <View style={[styles.innerCard, dynamicStyles.innerCard]}>
//             <Text style={[styles.universityLabel, dynamicStyles.text]}>
//               University:
//             </Text>

//             <View style={{ position: "relative" }}>
//               <Pressable
//                 style={[styles.campusSelector, dynamicStyles.innerCard]}
//                 onPress={() => setIsDropdownOpen(!isDropdownOpen)}
//               >
//                 <View style={styles.campusRow}>
//                   <Ionicons
//                     name="location-outline"
//                     size={16}
//                     color={dynamicStyles.text.color}
//                   />
//                   <View style={styles.dotIndicator} />
//                   <Text style={[styles.campusText, dynamicStyles.text]}>
//                     {isLoadingUniversities
//                       ? "Loading universities..."
//                       : selectedUniversity?.name || "Select your university"}
//                   </Text>
//                   <Ionicons
//                     name={isDropdownOpen ? "chevron-up" : "chevron-down"}
//                     size={16}
//                     color={dynamicStyles.text.color}
//                   />
//                 </View>
//               </Pressable>

//               {isDropdownOpen && (
//                 <ScrollView
//                   style={[styles.dropdown, dynamicStyles.innerCard]}
//                   showsVerticalScrollIndicator={true}
//                   nestedScrollEnabled
//                   keyboardShouldPersistTaps="handled"
//                 >
//                   {universities.map((uni) => (
//                     <Pressable
//                       key={uni.id}
//                       style={[
//                         styles.dropdownItem,
//                         {
//                           borderBottomColor:
//                             dynamicStyles.innerCard.borderColor,
//                         },
//                       ]}
//                       onPress={() => {
//                         setSelectedUniversity(uni);
//                         setIsDropdownOpen(false);
//                       }}
//                     >
//                       <View style={{ flex: 1 }}>
//                         <Text style={[styles.dropdownText, dynamicStyles.text]}>
//                           {uni.name}
//                         </Text>
//                         <Text
//                           style={[
//                             { fontSize: 12, marginTop: 2 },
//                             dynamicStyles.subtitle,
//                           ]}
//                         >
//                           {uni.city}, {uni.state}
//                         </Text>
//                       </View>
//                       {selectedUniversity?.id === uni.id && (
//                         <Ionicons name="checkmark" size={18} color="#00D084" />
//                       )}
//                     </Pressable>
//                   ))}
//                 </ScrollView>
//               )}
//             </View>

//             <View style={styles.resetSection}>
//               <Pressable
//                 style={[
//                   styles.resetButton,
//                   { borderColor: dynamicStyles.innerCard.borderColor },
//                 ]}
//                 onPress={() => reset()}
//               >
//                 <Ionicons
//                   name="refresh-outline"
//                   size={16}
//                   color={dynamicStyles.text.color}
//                 />
//                 <Text style={[styles.resetText, dynamicStyles.text]}>
//                   Reset
//                 </Text>
//               </Pressable>
//               <Text style={[styles.resetSubtext, dynamicStyles.subtitle]}>
//                 Filtered to your university
//               </Text>
//             </View>
//           </View>
//         </View>

//         {/* Smart Matches Section */}
//         <View style={styles.matchesSection}>
//           <Text style={[styles.sectionTitle, dynamicStyles.text]}>
//             Tarp AI Smart Matches
//           </Text>
//           <Text style={[styles.sectionSubtitle, dynamicStyles.subtitle]}>
//             AI-powered connections with students
//           </Text>

//           <View style={styles.cardsGrid}>
//             {categories.map((category) => (
//               <Pressable
//                 key={category.id}
//                 style={[styles.card, dynamicStyles.card]}
//                 onPress={() => {
//                   router.push(`/matches/${category.id}`);
//                 }}
//               >
//                 <View
//                   style={[
//                     styles.iconCircle,
//                     { backgroundColor: category.bgColor },
//                   ]}
//                 >
//                   <category.icon
//                     size={24}
//                     color={category.iconColor}
//                     strokeWidth={2}
//                   />
//                 </View>
//                 <Text style={[styles.cardTitle, dynamicStyles.text]}>
//                   {category.name}
//                 </Text>
//                 <Text style={[styles.cardSubtitle, dynamicStyles.subtitle]}>
//                   {category.subtitle}
//                 </Text>
//                 <View style={[styles.matchesBadge, dynamicStyles.matchesBadge]}>
//                   <Text style={[styles.matchesText, dynamicStyles.subtitle]}>
//                     {category.matches} matches
//                   </Text>
//                 </View>
//               </Pressable>
//             ))}
//           </View>

//           <View style={styles.recentSection}>
//             <View style={styles.recentHeader}>
//               <Text style={[styles.sectionTitle, dynamicStyles.text]}>
//                 Recent Matches
//               </Text>
//               <Pressable onPress={() => setShowAllRecent(!showAllRecent)}>
//                 <Text style={[styles.viewAllText, dynamicStyles.subtitle]}>
//                   {showAllRecent ? "Show Less" : "Show All"}
//                 </Text>
//               </Pressable>
//             </View>

//             {[
//               {
//                 id: 1,
//                 title: "63 new in Rides",
//                 users: 3,
//                 match: "96%",
//                 icon: Car,
//                 color: "#E6D5FF",
//                 time: "Just now",
//               },
//               {
//                 id: 2,
//                 title: "51 new in Giveaways",
//                 users: 3,
//                 match: "89%",
//                 icon: Gift,
//                 color: "#D5F5E3",
//                 time: "Just now",
//               },
//               {
//                 id: 3,
//                 title: "71 new in Party",
//                 users: 3,
//                 match: "93%",
//                 icon: PartyPopper,
//                 color: "#FFD5E6",
//                 time: "Just now",
//               },
//               {
//                 id: 4,
//                 title: "67 new in Study Groups",
//                 users: 3,
//                 match: "95%",
//                 icon: BookOpen,
//                 color: "#FFF9D5",
//                 time: "Just now",
//               },
//             ]
//               .slice(0, showAllRecent ? 4 : 3)
//               .map((match) => (
//                 <Pressable
//                   key={match.id}
//                   style={[styles.recentCard, dynamicStyles.card]}
//                   onPress={() => console.log(`Maps to ${match.title}`)}
//                 >
//                   <View
//                     style={[
//                       styles.recentIconCircle,
//                       { backgroundColor: match.color },
//                     ]}
//                   >
//                     <match.icon size={20} color="#000000" strokeWidth={2} />
//                   </View>
//                   <View style={styles.recentContent}>
//                     <Text style={[styles.recentTitle, dynamicStyles.text]}>
//                       {match.title}
//                     </Text>
//                     <View style={styles.recentUsers}>
//                       {[...Array(match.users)].map((_, i) => (
//                         <View
//                           key={i}
//                           style={[
//                             styles.userAvatar,
//                             dynamicStyles.avatarBorder,
//                             i > 0 && { marginLeft: -8 },
//                           ]}
//                         >
//                           <Text style={styles.avatarText}>
//                             {String.fromCharCode(65 + i)}
//                           </Text>
//                         </View>
//                       ))}
//                       <Text style={[styles.usersText, dynamicStyles.subtitle]}>
//                         +{match.users}
//                       </Text>
//                     </View>
//                   </View>
//                   <View style={styles.recentRight}>
//                     <Text style={[styles.timeText, dynamicStyles.subtitle]}>
//                       {match.time}
//                     </Text>
//                     <View
//                       style={[
//                         styles.percentageBadge,
//                         dynamicStyles.percentageBadge,
//                       ]}
//                     >
//                       <Text
//                         style={[
//                           styles.matchPercent,
//                           dynamicStyles.percentageText,
//                         ]}
//                       >
//                         {match.match}
//                       </Text>
//                     </View>
//                   </View>
//                 </Pressable>
//               ))}

//             {/* Compatibility Card */}
//             <Pressable
//               style={[
//                 styles.compatibilityCard,
//                 dynamicStyles.compatibilityCard,
//               ]}
//             >
//               <Ionicons
//                 name="heart-outline"
//                 size={24}
//                 color={dynamicStyles.text.color}
//               />
//               <View style={styles.compatibilityContent}>
//                 <Text style={[styles.compatibilityTitle, dynamicStyles.text]}>
//                   🎉 87% avg compatibility!
//                 </Text>
//                 <Text
//                   style={[styles.compatibilitySubtitle, dynamicStyles.subtitle]}
//                 >
//                   Higher than 92% of users
//                 </Text>
//               </View>
//             </Pressable>
//           </View>
//         </View>
//       </ScrollView>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     fontFamily: "Geist-Regular",
//   },
//   content: {
//     flex: 1,
//     paddingHorizontal: 16,
//   },
//   filterSection: {
//     marginTop: 16,
//     marginBottom: 24,
//   },
//   filterHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//     marginBottom: 12,
//   },
//   filterTitle: {
//     fontSize: 12,
//     fontWeight: "600",
//     flex: 1,
//   },
//   realTimeBadge: {
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: "#333333",
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//   },
//   realTimeText: {
//     fontSize: 10,
//     fontWeight: "500",
//   },
//   innerCard: {
//     borderRadius: 8,
//     borderWidth: 1,
//     padding: 12,
//     gap: 12,
//   },
//   universityLabel: {
//     fontSize: 13,
//     fontWeight: "600",
//   },
//   campusSelector: {
//     padding: 12,
//     borderRadius: 8,
//     borderWidth: 1,
//   },
//   campusRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//   },
//   dotIndicator: {
//     width: 6,
//     height: 6,
//     borderRadius: 6,
//     backgroundColor: "#FFFFFF",
//   },
//   campusText: {
//     flex: 1,
//     fontSize: 14,
//   },
//   resetSection: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//   },
//   resetButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 6,
//     paddingVertical: 6,
//     paddingHorizontal: 10,
//     borderWidth: 1,
//     borderRadius: 8,
//   },
//   dashed: {
//     borderWidth: 1,
//     borderStyle: "dashed",
//     borderRadius: 15,
//     padding: 12,
//   },
//   resetText: {
//     fontSize: 12,
//     fontWeight: "600",
//   },
//   resetSubtext: {
//     fontSize: 11,
//   },
//   matchesSection: {
//     marginBottom: 30,
//   },
//   sectionTitle: {
//     fontSize: 14,
//     fontWeight: "800",
//     marginBottom: 4,
//   },
//   sectionSubtitle: {
//     fontSize: 12,
//     marginBottom: 16,
//   },
//   cardsGrid: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 12,
//   },
//   card: {
//     width: "48%",
//     display: "flex",
//     flexDirection: "column",
//     height: 250,
//     borderRadius: 12,
//     borderWidth: 1,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   iconCircle: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 20,
//   },
//   cardTitle: {
//     fontSize: 14,
//     fontWeight: "600",
//     textAlign: "center",
//     marginBottom: 10,
//   },
//   cardSubtitle: {
//     fontSize: 12,
//     textAlign: "center",
//     marginBottom: 15,
//   },
//   matchesText: {
//     fontSize: 10,
//     fontWeight: "500",
//   },
//   recentSection: {
//     marginTop: 24,
//     marginBottom: 0,
//   },
//   recentHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 16,
//   },
//   viewAllText: {
//     fontSize: 14,
//   },
//   recentCard: {
//     flexDirection: "row",
//     alignItems: "center",
//     padding: 12,
//     borderRadius: 12,
//     borderWidth: 1,
//     marginBottom: 12,
//     gap: 12,
//   },
//   recentIconCircle: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   recentContent: {
//     flex: 1,
//   },
//   recentTitle: {
//     fontSize: 14,
//     fontWeight: "600",
//     marginBottom: 4,
//   },
//   recentUsers: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//   },
//   userAvatar: {
//     width: 20,
//     height: 20,
//     borderRadius: 10,
//     backgroundColor: "#9C27B0",
//     borderWidth: 2,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   avatarText: {
//     color: "#FFFFFF",
//     fontSize: 8,
//     fontWeight: "600",
//   },
//   usersText: {
//     fontSize: 12,
//     marginLeft: 4,
//   },
//   recentRight: {
//     alignItems: "flex-end",
//   },
//   timeText: {
//     fontSize: 12,
//     marginBottom: 4,
//   },
//   matchPercent: {
//     fontSize: 14,
//     fontWeight: "600",
//   },
//   compatibilityCard: {
//     flexDirection: "row",
//     alignItems: "center",
//     padding: 16,
//     borderRadius: 12,
//     borderWidth: 1,
//     gap: 12,
//     marginTop: 8,
//   },
//   compatibilityContent: {
//     flex: 1,
//   },
//   compatibilityTitle: {
//     fontSize: 14,
//     fontWeight: "600",
//     marginBottom: 2,
//   },
//   compatibilitySubtitle: {
//     fontSize: 12,
//   },
//   percentageBadge: {
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 8,
//   },
//   dropdown: {
//     position: "absolute",
//     top: 48,
//     left: 40,
//     right: 0,
//     zIndex: 1000,
//     borderRadius: 8,
//     borderWidth: 1,
//     marginTop: 4,
//   },
//   dropdownItem: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: 12,
//   },
//   matchesBadge: {
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 12,
//     alignSelf: "center",
//   },
//   dropdownText: {
//     fontSize: 14,
//   },
// });

// export default Index;





import { useTheme } from "@/app/contexts/ThemeContext";
import Header from "@/components/Header";
import PreviewModeBanner from "@/components/PreviewModeBanner";
import { Text } from "@/components/Themedtext";
import { useAuthStore } from "@/state/authStore";
import { useCampus } from '@/hooks/useCampus';
import { useCategories } from '@/hooks/useCategories';
import { University } from "@/types/auth";
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
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View, ActivityIndicator } from "react-native";

const Index = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAllRecent, setShowAllRecent] = useState(false);

  const { isDark } = useTheme();
  const { isAuthenticated } = useAuthStore();
  
  // Campus data from TanStack Query
  const { selectedUniversity, universities, isLoading: isLoadingUniversities, setSelectedUniversity, reset } = useCampus();
  
  // Categories data from TanStack Query
  const { data: categories = [], isLoading: isLoadingCategories } = useCategories(selectedUniversity?.id);

  console.log(isAuthenticated);

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
    filterContainer: {
      backgroundColor: isDark ? "#000000" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    innerCard: {
      backgroundColor: isDark ? "#000000" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    card: {
      backgroundColor: isDark ? "#000000" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    matchesBadge: {
      backgroundColor: isDark ? "#1A1A1A" : "#E0E0E0",
    },
    percentageBadge: {
      backgroundColor: isDark ? "#0A0A0A" : "#E5E5E5",
    },
    percentageText: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    avatarBorder: {
      borderColor: isDark ? "#000000" : "#FFFFFF",
    },
    compatibilityCard: {
      backgroundColor: isDark ? "#0A0A0A" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <View style={{ gap: 12 }}>
        <Header />
        {!isAuthenticated && <PreviewModeBanner />}
      </View>

      <ScrollView style={styles.content}>
        {/* Filter Campus Section */}
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
                  {universities.map((uni) => (
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
                        <Text style={[styles.dropdownText, dynamicStyles.text]}>
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
                        <Ionicons name="checkmark" size={18} color="#00D084" />
                      )}
                    </Pressable>
                  ))}
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
                {selectedUniversity ? "Filtered to your university" : "No filter applied"}
              </Text>
            </View>
          </View>
        </View>

        {/* Smart Matches Section */}
        <View style={styles.matchesSection}>
          <Text style={[styles.sectionTitle, dynamicStyles.text]}>
            Tarp AI Smart Matches
          </Text>
          <Text style={[styles.sectionSubtitle, dynamicStyles.subtitle]}>
            AI-powered connections with students
          </Text>

          {/* Loading state for categories */}
          {isLoadingCategories ? (
            <View style={styles.cardsGrid}>
              {Array.from({ length: 8 }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.card, dynamicStyles.card, { justifyContent: 'center' }]}
                >
                  <ActivityIndicator size="large" color={dynamicStyles.text.color} />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.cardsGrid}>
              {categories.map((category) => (
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
                    <category.icon
                      size={24}
                      color={category.iconColor}
                      strokeWidth={2}
                    />
                  </View>
                  <Text style={[styles.cardTitle, dynamicStyles.text]}>
                    {category.name}
                  </Text>
                  <Text style={[styles.cardSubtitle, dynamicStyles.subtitle]}>
                    {category.subtitle}
                  </Text>
                  <View style={[styles.matchesBadge, dynamicStyles.matchesBadge]}>
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

            {[
              {
                id: 1,
                title: "63 new in Rides",
                users: 3,
                match: "96%",
                icon: Car,
                color: "#E6D5FF",
                time: "Just now",
              },
              {
                id: 2,
                title: "51 new in Giveaways",
                users: 3,
                match: "89%",
                icon: Gift,
                color: "#D5F5E3",
                time: "Just now",
              },
              {
                id: 3,
                title: "71 new in Party",
                users: 3,
                match: "93%",
                icon: PartyPopper,
                color: "#FFD5E6",
                time: "Just now",
              },
              {
                id: 4,
                title: "67 new in Study Groups",
                users: 3,
                match: "95%",
                icon: BookOpen,
                color: "#FFF9D5",
                time: "Just now",
              },
            ]
              .slice(0, showAllRecent ? 4 : 3)
              .map((match) => (
                <Pressable
                  key={match.id}
                  style={[styles.recentCard, dynamicStyles.card]}
                  onPress={() => console.log(`Maps to ${match.title}`)}
                >
                  <View
                    style={[
                      styles.recentIconCircle,
                      { backgroundColor: match.color },
                    ]}
                  >
                    <match.icon size={20} color="#000000" strokeWidth={2} />
                  </View>
                  <View style={styles.recentContent}>
                    <Text style={[styles.recentTitle, dynamicStyles.text]}>
                      {match.title}
                    </Text>
                    <View style={styles.recentUsers}>
                      {[...Array(match.users)].map((_, i) => (
                        <View
                          key={i}
                          style={[
                            styles.userAvatar,
                            dynamicStyles.avatarBorder,
                            i > 0 && { marginLeft: -8 },
                          ]}
                        >
                          <Text style={styles.avatarText}>
                            {String.fromCharCode(65 + i)}
                          </Text>
                        </View>
                      ))}
                      <Text style={[styles.usersText, dynamicStyles.subtitle]}>
                        +{match.users}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.recentRight}>
                    <Text style={[styles.timeText, dynamicStyles.subtitle]}>
                      {match.time}
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
                        {match.match}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}

            {/* Compatibility Card */}
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
                  🎉 87% avg compatibility!
                </Text>
                <Text
                  style={[styles.compatibilitySubtitle, dynamicStyles.subtitle]}
                >
                  Higher than 92% of users
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// Same styles - unchanged
const styles = StyleSheet.create({
  container: {
    flex: 1,
    fontFamily: "Geist-Regular",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
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
});

export default Index;