import { StyleSheet, View } from "react-native";

interface CustomPaginationProps {
  currentIndex: number;
  totalDots: number;
}

const CustomPagination = ({
  currentIndex,
  totalDots,
}: CustomPaginationProps) => {
  return (
    <View style={styles.dotsContainer}>
      {Array.from({ length: totalDots }).map((_, index) => (
        <View
          key={index}
          style={index === currentIndex ? styles.dotActive : styles.dotInactive}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  dotActive: {
    width: 32,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  dotInactive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#666666",
  },
});

export default CustomPagination;