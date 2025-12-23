/**
 * Offline persistence and sync utilities
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  syncPending: boolean;
}

interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: unknown;
  timestamp: number;
}

const CACHE_PREFIX = 'lovable_cache_';
const PENDING_OPS_KEY = 'lovable_pending_operations';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

class OfflineStorage {
  private listeners: Set<(online: boolean) => void> = new Set();
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;

  constructor() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.notifyListeners(true);
    this.syncPendingOperations();
  };

  private handleOffline = () => {
    this.isOnline = false;
    this.notifyListeners(false);
  };

  private notifyListeners(online: boolean) {
    this.listeners.forEach(listener => listener(online));
  }

  onConnectionChange(callback: (online: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  getConnectionStatus(): boolean {
    return this.isOnline;
  }

  // Cache operations
  setCache<T>(key: string, data: T, syncPending: boolean = false): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      syncPending,
    };
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch (e) {
      console.warn('Failed to cache data:', e);
      this.cleanupOldCache();
    }
  }

  getCache<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(CACHE_PREFIX + key);
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);
      
      // Check if cache is expired
      if (Date.now() - entry.timestamp > CACHE_EXPIRY_MS) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }

      return entry.data;
    } catch {
      return null;
    }
  }

  getCacheWithMeta<T>(key: string): CacheEntry<T> | null {
    try {
      const item = localStorage.getItem(CACHE_PREFIX + key);
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);
      
      if (Date.now() - entry.timestamp > CACHE_EXPIRY_MS) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }

      return entry;
    } catch {
      return null;
    }
  }

  clearCache(key: string): void {
    localStorage.removeItem(CACHE_PREFIX + key);
  }

  // Pending operations for sync
  addPendingOperation(operation: Omit<PendingOperation, 'id' | 'timestamp'>): void {
    const operations = this.getPendingOperations();
    operations.push({
      ...operation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    });
    localStorage.setItem(PENDING_OPS_KEY, JSON.stringify(operations));
  }

  getPendingOperations(): PendingOperation[] {
    try {
      const item = localStorage.getItem(PENDING_OPS_KEY);
      return item ? JSON.parse(item) : [];
    } catch {
      return [];
    }
  }

  removePendingOperation(id: string): void {
    const operations = this.getPendingOperations().filter(op => op.id !== id);
    localStorage.setItem(PENDING_OPS_KEY, JSON.stringify(operations));
  }

  clearPendingOperations(): void {
    localStorage.removeItem(PENDING_OPS_KEY);
  }

  async syncPendingOperations(): Promise<{ synced: number; failed: number }> {
    if (this.syncInProgress || !this.isOnline) {
      return { synced: 0, failed: 0 };
    }

    this.syncInProgress = true;
    const operations = this.getPendingOperations();
    let synced = 0;
    let failed = 0;

    for (const op of operations) {
      try {
        // Import supabase dynamically to avoid circular dependencies
        const { supabase } = await import('@/integrations/supabase/client');
        
        switch (op.type) {
          case 'create':
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase.from(op.table as any) as any).insert(op.data);
            break;
          case 'update':
            const updateData = op.data as { id: string; [key: string]: unknown };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase.from(op.table as any) as any).update(updateData).eq('id', updateData.id);
            break;
          case 'delete':
            const deleteData = op.data as { id: string };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase.from(op.table as any) as any).delete().eq('id', deleteData.id);
            break;
        }
        
        this.removePendingOperation(op.id);
        synced++;
      } catch (error) {
        console.error('Sync operation failed:', error);
        failed++;
      }
    }

    this.syncInProgress = false;
    return { synced, failed };
  }

  private cleanupOldCache(): void {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(CACHE_PREFIX));
    const entries: { key: string; timestamp: number }[] = [];

    keys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const entry = JSON.parse(item);
          entries.push({ key, timestamp: entry.timestamp || 0 });
        }
      } catch {
        localStorage.removeItem(key);
      }
    });

    // Remove oldest entries if we have too many
    if (entries.length > 50) {
      entries.sort((a, b) => a.timestamp - b.timestamp);
      entries.slice(0, entries.length - 30).forEach(({ key }) => {
        localStorage.removeItem(key);
      });
    }
  }

  destroy(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.listeners.clear();
  }
}

export const offlineStorage = new OfflineStorage();

export default offlineStorage;
