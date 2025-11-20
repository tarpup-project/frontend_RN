import { useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";

interface UseSwipeToReplyProps {
  onReply: (message: any) => void;
  scrollGesture: any;
  message?: any; 
}

export const useSwipeToReply = ({ onReply, scrollGesture, message }: UseSwipeToReplyProps) => {
  const swipeGesture = useMemo(() => 
    Gesture.Pan()
      .activeOffsetX([-15, 15])
      .failOffsetY([-25, 25])
      .simultaneousWithExternalGesture(scrollGesture)
      .onEnd((event) => {
        const { translationX, velocityX, translationY } = event;
        
        if (
          translationX > 60 &&
          velocityX > 300 &&
          Math.abs(translationY) < 30
        ) {
          if (message && onReply) {
            runOnJS(onReply)(message);
          }
        }
      }),
    [onReply, scrollGesture, message]
  );
  
  return swipeGesture;
};