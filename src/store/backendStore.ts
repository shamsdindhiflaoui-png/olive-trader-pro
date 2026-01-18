import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BackendConfig, BackendMode, SyncState, SyncRecord, SyncStatus } from '@/types/api';

interface BackendState {
  config: BackendConfig;
  sync: SyncState;
  pendingSyncRecords: SyncRecord[];
  
  // Config actions
  setBackendMode: (mode: BackendMode) => void;
  updateConfig: (config: Partial<BackendConfig>) => void;
  
  // Sync actions
  addSyncRecord: (record: Omit<SyncRecord, 'id' | 'timestamp' | 'synced' | 'retries'>) => void;
  markSynced: (id: string) => void;
  markSyncError: (id: string) => void;
  clearSyncedRecords: () => void;
  updateSyncStatus: (status: SyncStatus, error?: string) => void;
  setLastSync: (date: Date) => void;
  
  // Helpers
  isApiMode: () => boolean;
  getApiUrl: () => string;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const defaultConfig: BackendConfig = {
  mode: 'local',
  apiUrl: 'http://localhost:3001/api',
  autoSync: true,
  syncInterval: 30,
};

const defaultSyncState: SyncState = {
  status: 'synced',
  lastSync: null,
  pendingChanges: 0,
  errors: [],
};

export const useBackendStore = create<BackendState>()(
  persist(
    (set, get) => ({
      config: defaultConfig,
      sync: defaultSyncState,
      pendingSyncRecords: [],
      
      setBackendMode: (mode) => {
        set((state) => ({
          config: { ...state.config, mode },
          sync: { ...state.sync, status: mode === 'local' ? 'synced' : 'pending' },
        }));
      },
      
      updateConfig: (config) => {
        set((state) => ({
          config: { ...state.config, ...config },
        }));
      },
      
      addSyncRecord: (record) => {
        const newRecord: SyncRecord = {
          ...record,
          id: generateId(),
          timestamp: new Date(),
          synced: false,
          retries: 0,
        };
        
        set((state) => ({
          pendingSyncRecords: [...state.pendingSyncRecords, newRecord],
          sync: {
            ...state.sync,
            status: 'pending',
            pendingChanges: state.pendingSyncRecords.length + 1,
          },
        }));
      },
      
      markSynced: (id) => {
        set((state) => {
          const updated = state.pendingSyncRecords.map((r) =>
            r.id === id ? { ...r, synced: true } : r
          );
          const pendingCount = updated.filter((r) => !r.synced).length;
          
          return {
            pendingSyncRecords: updated,
            sync: {
              ...state.sync,
              pendingChanges: pendingCount,
              status: pendingCount === 0 ? 'synced' : 'pending',
            },
          };
        });
      },
      
      markSyncError: (id) => {
        set((state) => {
          const updated = state.pendingSyncRecords.map((r) =>
            r.id === id ? { ...r, retries: r.retries + 1 } : r
          );
          
          return {
            pendingSyncRecords: updated,
            sync: { ...state.sync, status: 'error' },
          };
        });
      },
      
      clearSyncedRecords: () => {
        set((state) => ({
          pendingSyncRecords: state.pendingSyncRecords.filter((r) => !r.synced),
        }));
      },
      
      updateSyncStatus: (status, error) => {
        set((state) => ({
          sync: {
            ...state.sync,
            status,
            errors: error ? [...state.sync.errors.slice(-9), error] : state.sync.errors,
          },
        }));
      },
      
      setLastSync: (date) => {
        set((state) => ({
          sync: { ...state.sync, lastSync: date },
        }));
      },
      
      isApiMode: () => get().config.mode === 'api',
      
      getApiUrl: () => get().config.apiUrl,
    }),
    {
      name: 'olive-oil-backend-config',
    }
  )
);
