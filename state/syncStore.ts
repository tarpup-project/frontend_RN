import { create } from 'zustand';

interface SyncState {
    isSyncing: boolean;
    setIsSyncing: (isSyncing: boolean) => void;
    statusMessage: string | null;
    setStatusMessage: (message: string | null) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
    isSyncing: false,
    setIsSyncing: (isSyncing) => set({ isSyncing }),
    statusMessage: null,
    setStatusMessage: (statusMessage) => set({ statusMessage }),
}));
