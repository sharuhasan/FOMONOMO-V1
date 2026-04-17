import { create } from 'zustand';

interface FilterState {
  selectedCategory: string | null;
  selectedTime: string;
  searchQuery: string;
  advancedFilters: {
    genderFilter: string;
    minAge: string;
    maxAge: string;
    distance: string;
    societyTag: string;
  };
  setCategory: (category: string | null) => void;
  setTime: (time: string) => void;
  setSearchQuery: (query: string) => void;
  setAdvancedFilters: (filters: Partial<FilterState['advancedFilters']>) => void;
  resetFilters: () => void;
}

const defaultAdvancedFilters = {
  genderFilter: 'any',
  minAge: '',
  maxAge: '',
  distance: '10',
  societyTag: '',
};

export const useFilterStore = create<FilterState>()((set) => ({
  selectedCategory: null,
  selectedTime: 'Today',
  searchQuery: '',
  advancedFilters: { ...defaultAdvancedFilters },
  setCategory: (selectedCategory) => set({ selectedCategory }),
  setTime: (selectedTime) => set({ selectedTime }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setAdvancedFilters: (filters) =>
    set((state) => ({
      advancedFilters: { ...state.advancedFilters, ...filters },
    })),
  resetFilters: () =>
    set({
      selectedCategory: null,
      selectedTime: 'Today',
      searchQuery: '',
      advancedFilters: { ...defaultAdvancedFilters },
    }),
}));
