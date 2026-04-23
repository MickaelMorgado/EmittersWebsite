import { create } from 'zustand';

export interface TikTokVideo {
  id: string;
  postDate: string;
  caption: string;
  url: string;
  metricsDate: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

interface TikTokAnalyticsState {
  videos: TikTokVideo[];
  sortField: keyof TikTokVideo | null;
  sortDirection: 'asc' | 'desc';
  setVideos: (videos: TikTokVideo[]) => void;
  setSort: (field: keyof TikTokVideo | null) => void;
  toggleSort: (field: keyof TikTokVideo) => void;
}

export const useTikTokAnalyticsStore = create<TikTokAnalyticsState>((set) => ({
  videos: [],
  sortField: null,
  sortDirection: 'desc',
  setVideos: (videos) => set({ videos }),
  setSort: (field) => set({ sortField: field }),
  toggleSort: (field) =>
    set((state) => ({
      sortField: field,
      sortDirection: state.sortField === field && state.sortDirection === 'desc' ? 'asc' : 'desc',
    })),
}));
