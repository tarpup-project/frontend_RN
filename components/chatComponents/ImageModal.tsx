import { X } from "lucide-react-native";
import React from "react";
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

interface ImageModalProps {
  imageUrl: string | null;
  visible: boolean;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  imageUrl,
  visible,
  onClose,
}) => {
  console.log("🖼️ ImageModal render:", { imageUrl, visible });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
       {/* <Pressable onPress={(e) => e.stopPropagation()}> */}
      <View style={styles.imageModalOverlay}>
        <Pressable
          style={styles.imageModalBackground}
          onPress={onClose}
        >
          <View style={styles.imageModalContent}>
            <Pressable
              style={styles.closeButton}
              onPress={onClose}
            >
              <X size={28} color="#FFFFFF" />
            </Pressable>

            {imageUrl && (
              <Image
                source={{ uri: imageUrl }}
                style={styles.fullImage}
                resizeMode="contain"
              />
            )}
          </View>
        </Pressable>        
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  imageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1,
    padding: 8,
  },
  fullImage: {
    width: "90%",
    height: "90%",
    maxWidth: 500,
    maxHeight: 500,
  },
});