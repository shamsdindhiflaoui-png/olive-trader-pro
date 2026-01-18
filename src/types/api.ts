// API & Backend Configuration Types

export type BackendMode = 'local' | 'api';
export type SyncStatus = 'synced' | 'pending' | 'error' | 'offline';

export interface BackendConfig {
  mode: BackendMode;
  apiUrl: string;
  apiKey?: string;
  autoSync: boolean;
  syncInterval: number; // in seconds
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  expiresAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Sync Types
export interface SyncRecord {
  id: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete';
  data: unknown;
  timestamp: Date;
  synced: boolean;
  retries: number;
}

export interface SyncState {
  status: SyncStatus;
  lastSync: Date | null;
  pendingChanges: number;
  errors: string[];
}

// API Endpoints definition for your backend
export const API_ENDPOINTS = {
  // Auth
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    me: '/auth/me',
  },
  // Data endpoints
  clients: '/clients',
  clientsGros: '/clients-gros',
  clientOperations: '/client-operations',
  bonsReception: '/bons-reception',
  triturations: '/triturations',
  reservoirs: '/reservoirs',
  stockAffectations: '/stock-affectations',
  stockMovements: '/stock-movements',
  bonsLivraison: '/bons-livraison',
  invoices: '/invoices',
  invoicePayments: '/invoice-payments',
  paymentReceipts: '/payment-receipts',
  settings: '/settings',
  // Sync
  sync: {
    push: '/sync/push',
    pull: '/sync/pull',
    status: '/sync/status',
  },
} as const;
