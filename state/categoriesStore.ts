import { create } from 'zustand';

interface Category {
  id: string;
  name: string;
  subtitle: string;
  matches: number;
  bgColor: string;
  iconColor: string;
  icon: any;
}

interface CategoriesState {
  categories: Category[];
  isLoading: boolean;
  
  setCategories: (categories: Category[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useCategoriesStore = create<CategoriesState>((set) => ({
  categories: [],
  isLoading: false,

  setCategories: (categories) => {
    set({ categories });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },
}));