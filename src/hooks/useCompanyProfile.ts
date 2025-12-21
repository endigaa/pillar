import { create } from 'zustand';
import type { CompanyProfile } from '@shared/types';
import { api } from '@/lib/api-client';
interface CompanyProfileState {
  profile: CompanyProfile | null;
  isLoading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (newProfile: CompanyProfile) => Promise<void>;
}
export const useCompanyProfile = create<CompanyProfileState>((set, get) => ({
  profile: null,
  isLoading: false,
  error: null,
  fetchProfile: async () => {
    // Prevent redundant fetches if data is already loaded or loading
    if (get().profile || get().isLoading) return;
    try {
      set({ isLoading: true, error: null });
      const data = await api<CompanyProfile>('/api/company-profile');
      set({ profile: data, isLoading: false });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to fetch company profile';
      set({ error, isLoading: false });
    }
  },
  updateProfile: async (newProfile: CompanyProfile) => {
    try {
      set({ isLoading: true, error: null });
      const updatedProfile = await api<CompanyProfile>('/api/company-profile', {
        method: 'PUT',
        body: JSON.stringify(newProfile),
      });
      set({ profile: updatedProfile, isLoading: false });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update company profile';
      set({ error, isLoading: false });
      throw new Error(error);
    }
  },
}));