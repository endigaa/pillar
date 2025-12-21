import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { Loader2 } from 'lucide-react';
export function AppInitializer() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Seed the database once on mount
        await api('/api/seed', { method: 'POST' });
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize app:', err);
        setError('Failed to initialize application. Please try refreshing.');
      }
    };
    initializeApp();
  }, []);
  if (error) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground p-4">
        <p className="text-destructive mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }
  if (!isInitialized) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Initializing Pillar...</p>
      </div>
    );
  }
  return <Outlet />;
}