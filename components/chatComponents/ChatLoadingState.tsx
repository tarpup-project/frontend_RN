import Header from "@/components/Header";
import { Skeleton } from "@/components/Skeleton";
import { useTheme } from "@/contexts/ThemeContext";
import React from "react";
import { StyleSheet, View } from "react-native";

export const ChatLoadingState: React.FC = () => {
  const { isDark } = useTheme();

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
    },
    header: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      borderBottomColor: isDark ? "#333333" : "#E0E0E0",
    },
  };

  const MessageSkeleton = ({ isMe }: { isMe: boolean }) => (
    <View style={[styles.messageRow, isMe && styles.myMessageRow]}>
      {!isMe && <Skeleton width={32} height={32} borderRadius={16} />}
      <View style={[styles.messageBubble, { padding: 12 }]}>
        {!isMe && (
          <Skeleton width={60} height={12} style={{ marginBottom: 4 }} />
        )}
        <Skeleton
          width={Math.random() * 100 + 100}
          height={14}
          style={{ marginBottom: 4 }}
        />
        <Skeleton width={40} height={10} />
      </View>
    </View>
  );

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Header />
      <View style={[styles.header, dynamicStyles.header]}>
        <Skeleton width={24} height={24} borderRadius={12} />
        <View style={styles.headerInfo}>
          <View style={styles.avatarsContainer}>
            <Skeleton width={32} height={32} borderRadius={16} />
            <Skeleton
              width={32}
              height={32}
              borderRadius={16}
              style={{ marginLeft: -8 }}
            />
          </View>
          <View style={styles.headerText}>
            <Skeleton width={120} height={16} style={{ marginBottom: 4 }} />
            <Skeleton width={80} height={12} />
          </View>
        </View>
        <Skeleton width={24} height={24} borderRadius={12} />
      </View>

      <View style={styles.messagesContainer}>
        <View style={styles.messagesContent}>
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <MessageSkeleton key={i} isMe={i % 3 === 0} />
            ))}
        </View>
      </View>

      <View style={styles.inputSection}>
        <Skeleton width={24} height={24} borderRadius={12} />
        <Skeleton height={44} borderRadius={22} style={{ flex: 1 }} />
        <Skeleton width={44} height={44} borderRadius={22} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  headerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: "row",
    gap: 8,
    maxWidth: "85%",
    alignItems: "flex-end",
    marginVertical: 4,
  },
  myMessageRow: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: "100%",
    alignSelf: "flex-start",
  },
  inputSection: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 16,
    gap: 8,
  },
});