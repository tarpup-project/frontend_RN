import { create } from 'zustand';
import { University } from '../types/auth';

interface CampusState {
  selectedUniversity: University | null;
  universities: University[];
  isLoadingUniversities: boolean;
  
  setSelectedUniversity: (university: University | null) => void;
  setUniversities: (universities: University[]) => void;
  setIsLoadingUniversities: (loading: boolean) => void;
  reset: () => void;
}

export const useCampusStore = create<CampusState>((set) => ({
  selectedUniversity: null,
  universities: [],
  isLoadingUniversities: false,

  setSelectedUniversity: (university) => {
    set({ selectedUniversity: university });
  },

  setUniversities: (universities) => {
    set({ universities });
  },

  setIsLoadingUniversities: (loading) => {
    set({ isLoadingUniversities: loading });
  },

  reset: () => {
    set({ selectedUniversity: null });
  },
}));