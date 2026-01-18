import { useBackendStore } from '@/store/backendStore';
import { useAppStore } from '@/store/appStore';
import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '@/types/api';

interface SyncData {
  clients: unknown[];
  clientsGros: unknown[];
  clientOperations: unknown[];
  bonsReception: unknown[];
  triturations: unknown[];
  reservoirs: unknown[];
  stockAffectations: unknown[];
  stockMovements: unknown[];
  bonsLivraison: unknown[];
  invoices: unknown[];
  invoicePayments: unknown[];
  paymentReceipts: unknown[];
  settings: unknown;
}

class SyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  
  // Start auto-sync if configured
  startAutoSync() {
    const { config } = useBackendStore.getState();
    
    if (config.mode !== 'api' || !config.autoSync) {
      return;
    }
    
    this.stopAutoSync();
    
    this.syncInterval = setInterval(() => {
      this.syncPendingChanges();
    }, config.syncInterval * 1000);
  }
  
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
  
  // Push local changes to server
  async syncPendingChanges(): Promise<{ success: boolean; error?: string }> {
    const backendStore = useBackendStore.getState();
    
    if (backendStore.config.mode !== 'api') {
      return { success: true };
    }
    
    const pendingRecords = backendStore.pendingSyncRecords.filter((r) => !r.synced);
    
    if (pendingRecords.length === 0) {
      backendStore.updateSyncStatus('synced');
      return { success: true };
    }
    
    backendStore.updateSyncStatus('pending');
    
    try {
      const response = await apiClient.post(API_ENDPOINTS.sync.push, {
        records: pendingRecords,
      });
      
      if (response.success) {
        pendingRecords.forEach((r) => backendStore.markSynced(r.id));
        backendStore.clearSyncedRecords();
        backendStore.setLastSync(new Date());
        backendStore.updateSyncStatus('synced');
        return { success: true };
      }
      
      backendStore.updateSyncStatus('error', response.error);
      return { success: false, error: response.error };
    } catch (error) {
      backendStore.updateSyncStatus('error', 'Erreur de synchronisation');
      return { success: false, error: 'Erreur de synchronisation' };
    }
  }
  
  // Pull data from server to local
  async pullFromServer(): Promise<{ success: boolean; error?: string }> {
    const backendStore = useBackendStore.getState();
    
    if (backendStore.config.mode !== 'api') {
      return { success: false, error: 'Mode local activé' };
    }
    
    try {
      const response = await apiClient.get<SyncData>(API_ENDPOINTS.sync.pull);
      
      if (response.success && response.data) {
        // Import data to local store
        this.importDataToStore(response.data);
        backendStore.setLastSync(new Date());
        backendStore.updateSyncStatus('synced');
        return { success: true };
      }
      
      return { success: false, error: response.error };
    } catch (error) {
      return { success: false, error: 'Erreur lors de la récupération des données' };
    }
  }
  
  // Push all local data to server (full sync)
  async pushToServer(): Promise<{ success: boolean; error?: string }> {
    const backendStore = useBackendStore.getState();
    
    if (backendStore.config.mode !== 'api') {
      return { success: false, error: 'Mode local activé' };
    }
    
    const appStore = useAppStore.getState();
    
    const data: SyncData = {
      clients: appStore.clients,
      clientsGros: appStore.clientsGros,
      clientOperations: appStore.clientOperations,
      bonsReception: appStore.bonsReception,
      triturations: appStore.triturations,
      reservoirs: appStore.reservoirs,
      stockAffectations: appStore.stockAffectations,
      stockMovements: appStore.stockMovements,
      bonsLivraison: appStore.bonsLivraison,
      invoices: appStore.invoices,
      invoicePayments: appStore.invoicePayments,
      paymentReceipts: appStore.paymentReceipts,
      settings: appStore.settings,
    };
    
    try {
      const response = await apiClient.post(API_ENDPOINTS.sync.push, { fullSync: true, data });
      
      if (response.success) {
        backendStore.setLastSync(new Date());
        backendStore.updateSyncStatus('synced');
        return { success: true };
      }
      
      return { success: false, error: response.error };
    } catch (error) {
      return { success: false, error: 'Erreur lors de l\'envoi des données' };
    }
  }
  
  // Export local data as JSON (for backup)
  exportData(): string {
    const appStore = useAppStore.getState();
    
    const data = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      data: {
        clients: appStore.clients,
        clientsGros: appStore.clientsGros,
        clientOperations: appStore.clientOperations,
        bonsReception: appStore.bonsReception,
        triturations: appStore.triturations,
        reservoirs: appStore.reservoirs,
        stockAffectations: appStore.stockAffectations,
        stockMovements: appStore.stockMovements,
        bonsLivraison: appStore.bonsLivraison,
        invoices: appStore.invoices,
        invoicePayments: appStore.invoicePayments,
        paymentReceipts: appStore.paymentReceipts,
        settings: appStore.settings,
      },
    };
    
    return JSON.stringify(data, null, 2);
  }
  
  // Import data from JSON backup
  importData(jsonData: string): { success: boolean; error?: string } {
    try {
      const parsed = JSON.parse(jsonData);
      
      if (!parsed.data) {
        return { success: false, error: 'Format de fichier invalide' };
      }
      
      this.importDataToStore(parsed.data);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erreur lors de l\'import des données' };
    }
  }
  
  private importDataToStore(data: Partial<SyncData>) {
    // This would need to be implemented based on how you want to handle imports
    // For now, we'll just log - actual implementation depends on your merge strategy
    console.log('Importing data:', data);
    // You could emit an event or call a store method to merge this data
  }
}

export const syncService = new SyncService();
