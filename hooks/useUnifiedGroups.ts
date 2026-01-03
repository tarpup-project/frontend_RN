import { isWatermelonAvailable } from '@/database';
import { useGroups } from './useGroups';
import { useWatermelonGroups } from './useWatermelonGroups';

// Unified hook that automatically chooses the appropriate implementation
export const useUnifiedGroups = () => {
  const watermelonResult = useWatermelonGroups();
  const tanstackResult = useGroups();

  // Return the appropriate implementation based on availability
  if (isWatermelonAvailable) {
    return watermelonResult;
  } else {
    return tanstackResult;
  }
};