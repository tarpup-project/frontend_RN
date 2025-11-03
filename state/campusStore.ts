import { create } from 'zustand';
import { University } from '../types/auth';

interface CampusState {
  selectedUniversity: University | null;
  setSelectedUniversity: (university: University | null) => void;
  reset: () => void;
}

export const useCampusStore = create<CampusState>((set) => ({
  selectedUniversity: null,
  setSelectedUniversity: (university) => set({ selectedUniversity: university }),
  reset: () => set({ selectedUniversity: null }),
}));