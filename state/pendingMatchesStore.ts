import { create } from 'zustand';

interface PendingMatchesState {
  viewedMatchIds: Set<string>;
  markAsViewed: (id: string) => void;
  markMultipleAsViewed: (ids: string[]) => void;
  resetViewed: () => void;
}

export const usePendingMatchesStore = create<PendingMatchesState>((set) => ({
  viewedMatchIds: new Set(),
  markAsViewed: (id) => set((state) => {
    const newSet = new Set(state.viewedMatchIds);
    newSet.add(id);
    return { viewedMatchIds: newSet };
  }),
  markMultipleAsViewed: (ids) => set((state) => {
    const newSet = new Set(state.viewedMatchIds);
    ids.forEach(id => newSet.add(id));
    return { viewedMatchIds: newSet };
  }),
  resetViewed: () => set({ viewedMatchIds: new Set() }),
}));
