import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser, AuthState, LoginCredentials, RegisterData, AuthResponse } from '@/types/api';
import { apiClient } from '@/services/apiClient';

interface AuthStore extends AuthState {
  // Actions
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  checkAuth: () => Promise<boolean>;
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      
      login: async (credentials) => {
        set({ isLoading: true });
        
        try {
          const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
          
          if (response.success && response.data) {
            set({
              user: response.data.user,
              token: response.data.token,
              isAuthenticated: true,
              isLoading: false,
            });
            return { success: true };
          }
          
          set({ isLoading: false });
          return { success: false, error: response.error || 'Échec de connexion' };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: 'Erreur de connexion au serveur' };
        }
      },
      
      register: async (data) => {
        set({ isLoading: true });
        
        try {
          const response = await apiClient.post<AuthResponse>('/auth/register', data);
          
          if (response.success && response.data) {
            set({
              user: response.data.user,
              token: response.data.token,
              isAuthenticated: true,
              isLoading: false,
            });
            return { success: true };
          }
          
          set({ isLoading: false });
          return { success: false, error: response.error || "Échec d'inscription" };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: 'Erreur de connexion au serveur' };
        }
      },
      
      logout: async () => {
        try {
          await apiClient.post('/auth/logout', {});
        } catch {
          // Continue with local logout even if server fails
        }
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
      
      refreshToken: async () => {
        const { token } = get();
        if (!token) return false;
        
        try {
          const response = await apiClient.post<AuthResponse>('/auth/refresh', { token });
          
          if (response.success && response.data) {
            set({
              token: response.data.token,
              user: response.data.user,
            });
            return true;
          }
          
          return false;
        } catch {
          return false;
        }
      },
      
      checkAuth: async () => {
        const { token } = get();
        if (!token) return false;
        
        set({ isLoading: true });
        
        try {
          const response = await apiClient.get<AuthUser>('/auth/me');
          
          if (response.success && response.data) {
            set({
              user: response.data,
              isAuthenticated: true,
              isLoading: false,
            });
            return true;
          }
          
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return false;
        } catch {
          set({ isLoading: false });
          return false;
        }
      },
      
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'olive-oil-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
