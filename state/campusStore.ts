// import { create } from 'zustand';
// import { University } from '../types/auth';

// interface CampusState {
//   selectedUniversity: University | null;
//   setSelectedUniversity: (university: University | null) => void;
//   reset: () => void;
// }

// export const useCampusStore = create<CampusState>((set) => ({
//   selectedUniversity: null,
//   setSelectedUniversity: (university) => set({ selectedUniversity: university }),
//   reset: () => set({ selectedUniversity: null }),
// }));

import { create } from 'zustand';
import { University } from '../types/auth';
import { storage, StorageKeys } from '../utils/storage';

interface CampusState {
  selectedUniversity: University | null;
  setSelectedUniversity: (university: University) => Promise<void>;
  reset: () => void;
}

export const useCampusStore = create<CampusState>((set) => ({
  selectedUniversity: null,

  setSelectedUniversity: async (university) => {
    await storage.setValue(StorageKeys.UNIVERSITY_ID, university.id);
    set({ selectedUniversity: university });
  },

  reset: () => {
    set({ selectedUniversity: null });
  },
}));