import { create } from 'zustand';

interface NetworkState {
    isApiConnectionError: boolean;
    apiErrorMessage: string | null;
    setApiConnectionError: (isError: boolean, message?: string | null) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
    isApiConnectionError: false,
    apiErrorMessage: null,
    setApiConnectionError: (isError, message = null) =>
        set({ isApiConnectionError: isError, apiErrorMessage: message }),
}));
