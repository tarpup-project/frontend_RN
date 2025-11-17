import { useTheme } from "@/contexts/ThemeContext";
import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface LinkConfirmModalProps {
  url: string | null;
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const LinkConfirmModal: React.FC<LinkConfirmModalProps> = ({
  url,
  visible,
  onConfirm,
  onCancel,
}) => {
  const { isDark } = useTheme();

  const dynamicStyles = {
    modal: {
      backgroundColor: isDark ? "#0A0A0A" : "#FFFFFF",
      borderColor: isDark ? "#43474c" : "#d6dadf",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.centeredModalContainer}>
        <View style={[styles.linkModal, dynamicStyles.modal]}>
          <Text style={[styles.linkModalTitle, dynamicStyles.text]}>
            Open Link?
          </Text>
          <Text
            style={[styles.linkModalUrl, dynamicStyles.subtitle]}
            numberOfLines={2}
          >
            {url}
          </Text>
          <View style={styles.linkModalButtons}>
            <Pressable
              style={[styles.linkModalButton, styles.linkModalCancel]}
              onPress={onCancel}
            >
              <Text style={styles.linkModalCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.linkModalButton, styles.linkModalOpen]}
              onPress={onConfirm}
            >
              <Text style={styles.linkModalOpenText}>Open</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  linkModal: {
    borderRadius: 12,
    padding: 20,
    minWidth: 280,
    maxWidth: "90%",
  },
  linkModalTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  linkModalUrl: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
  },
  linkModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  linkModalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  linkModalCancel: {
    backgroundColor: "#F5F5F5",
  },
  linkModalOpen: {
    backgroundColor: "#007AFF",
  },
  linkModalCancelText: {
    color: "#000000",
    fontWeight: "500",
  },
  linkModalOpenText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
});