import { create } from 'zustand';

interface TarpsState {
    unseenCount: number;
    setUnseenCount: (count: number) => void;
    decrementUnseenCount: (amount?: number) => void;
}

export const useTarpsStore = create<TarpsState>((set) => ({
    unseenCount: 0,
    setUnseenCount: (count) => set({ unseenCount: count }),
    decrementUnseenCount: (amount = 1) => set((state) => ({
        unseenCount: Math.max(0, state.unseenCount - amount)
    })),
}));
