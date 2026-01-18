import { ApiResponse } from '@/types/api';
import { useBackendStore } from '@/store/backendStore';
import { useAuthStore } from '@/store/authStore';

class ApiClient {
  private getBaseUrl(): string {
    return useBackendStore.getState().config.apiUrl;
  }
  
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    const token = useAuthStore.getState().token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const apiKey = useBackendStore.getState().config.apiKey;
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }
    
    return headers;
  }
  
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const data = await response.json();
      
      if (!response.ok) {
        // Handle 401 - token expired
        if (response.status === 401) {
          const refreshed = await useAuthStore.getState().refreshToken();
          if (!refreshed) {
            useAuthStore.getState().logout();
          }
        }
        
        return {
          success: false,
          error: data.message || data.error || `Erreur ${response.status}`,
        };
      }
      
      return {
        success: true,
        data: data.data ?? data,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Erreur de parsing de la réponse',
      };
    }
  }
  
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Erreur de connexion au serveur',
      };
    }
  }
  
  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Erreur de connexion au serveur',
      };
    }
  }
  
  async put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Erreur de connexion au serveur',
      };
    }
  }
  
  async patch<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Erreur de connexion au serveur',
      };
    }
  }
  
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Erreur de connexion au serveur',
      };
    }
  }
  
  // Test connection to the backend
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        return { success: true, message: 'Connexion réussie' };
      }
      
      return { success: false, message: `Erreur ${response.status}` };
    } catch (error) {
      return { success: false, message: 'Serveur inaccessible' };
    }
  }
}

export const apiClient = new ApiClient();
