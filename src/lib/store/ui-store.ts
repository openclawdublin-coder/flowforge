import { create } from 'zustand';

type UIState = {
  projectView: 'grid' | 'list';
  setProjectView: (view: 'grid' | 'list') => void;
};

export const useUIStore = create<UIState>((set) => ({
  projectView: 'grid',
  setProjectView: (projectView) => set({ projectView }),
}));
