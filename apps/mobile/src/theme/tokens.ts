export const COLOR_PRESETS = [
  { name: 'Coral', primary: '0 100% 71%', secondary: '270 91% 65%', accent: '168 76% 42%' },
  { name: 'Ocean', primary: '217 91% 60%', secondary: '195 80% 50%', accent: '168 76% 42%' },
  { name: 'Sunset', primary: '31 96% 61%', secondary: '0 100% 71%', accent: '48 96% 53%' },
  { name: 'Forest', primary: '168 76% 42%', secondary: '140 60% 40%', accent: '48 96% 53%' },
  { name: 'Royal', primary: '270 91% 65%', secondary: '217 91% 60%', accent: '330 85% 65%' },
  { name: 'Midnight', primary: '240 50% 50%', secondary: '270 60% 55%', accent: '330 85% 65%' },
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  Sports: '#FF6B6B',
  Food: '#F97316',
  Study: '#3B82F6',
  Music: '#8B5CF6',
  Art: '#EC4899',
  Social: '#10B981',
  Fitness: '#EAB308',
  Gaming: '#6366F1',
};
