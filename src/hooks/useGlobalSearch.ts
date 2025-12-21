import { useEffect } from 'react';
import { create } from 'zustand';
import { api } from '@/lib/api-client';
import type { Project, Client, Invoice } from '@shared/types';
export type SearchItem = {
  id: string;
  type: 'Project' | 'Client' | 'Invoice' | 'Page';
  title: string;
  description?: string;
  url: string;
};
interface GlobalSearchState {
  items: SearchItem[];
  isLoading: boolean;
  isInitialized: boolean;
  fetchItems: () => Promise<void>;
}
export const useGlobalSearchStore = create<GlobalSearchState>((set, get) => ({
  items: [],
  isLoading: false,
  isInitialized: false,
  fetchItems: async () => {
    if (get().isInitialized || get().isLoading) return;
    set({ isLoading: true });
    try {
      const [projects, clients, invoices] = await Promise.all([
        api<Project[]>('/api/projects'),
        api<Client[]>('/api/clients'),
        api<Invoice[]>('/api/invoices'),
      ]);
      const searchItems: SearchItem[] = [
        // Projects
        ...projects.map((p) => ({
          id: p.id,
          type: 'Project' as const,
          title: p.name,
          description: `Client: ${p.clientName} • Status: ${p.status}`,
          url: `/projects/${p.id}`,
        })),
        // Clients
        ...clients.map((c) => ({
          id: c.id,
          type: 'Client' as const,
          title: c.name,
          description: c.email,
          url: `/clients/${c.id}/statement`,
        })),
        // Invoices
        ...invoices.map((i) => ({
          id: i.id,
          type: 'Invoice' as const,
          title: `Invoice ${i.invoiceNumber}`,
          description: `${i.projectName} • ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(i.total / 100)}`,
          url: `/invoices/${i.id}`,
        })),
      ];
      set({ items: searchItems, isInitialized: true, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch global search data', error);
      set({ isLoading: false });
    }
  }
}));
export function useGlobalSearch() {
  const items = useGlobalSearchStore(s => s.items);
  const isLoading = useGlobalSearchStore(s => s.isLoading);
  const fetchItems = useGlobalSearchStore(s => s.fetchItems);
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);
  return { items, isLoading };
}