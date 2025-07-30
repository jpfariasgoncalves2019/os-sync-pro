const API_BASE_URL = 'https://ppxexzbmaepudhkqfozt.supabase.co/functions/v1';

// Generate and persist user ID
function getUserId(): string {
  let userId = localStorage.getItem('usuario_id');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('usuario_id', userId);
  }
  return userId;
}

// Generate idempotency key for non-GET requests
function generateIdempotencyKey(): string {
  return crypto.randomUUID();
}

// API response envelope type
interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Error mapping for user-friendly messages
const ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: 'Dados inválidos. Verifique os campos obrigatórios.',
  DUPLICATE_NUMBER: 'Número da OS já existe.',
  DUPLICATE_CLIENT: 'Cliente já existe com este telefone e nome.',
  NOT_FOUND: 'Registro não encontrado.',
  NETWORK_ERROR: 'Erro de conexão. Tente novamente.',
  TIMEOUT: 'Tempo limite esgotado. Tente novamente.',
  OPENAI_UNAUTHORIZED: 'Chave OpenAI inválida. Verifique e tente novamente.',
  INVALID_KEY: 'Chave inválida. Verifique e tente novamente.',
  METHOD_NOT_ALLOWED: 'Operação não permitida.',
  INTERNAL_ERROR: 'Erro interno. Tente novamente mais tarde.',
};

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 500, // 0.5s
  maxDelay: 2000, // 2s
};

// Sleep utility for retries
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Check network connectivity
function isOnline(): boolean {
  return navigator.onLine;
}

// Main API client class
class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const isGetRequest = options.method === 'GET' || !options.method;
    
    // Add headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBweGV4emJtYWVwdWRoa3Fmb3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MzEzNjcsImV4cCI6MjA2OTQwNzM2N30.Pwhds11TJS11BDfatXjml-W4A-FTiroO9Ph5ugPfCfI',
      ...(options.headers as Record<string, string>),
    };

    // Add idempotency key for non-GET requests
    if (!isGetRequest) {
      (headers as Record<string, string>)['Idempotency-Key'] = generateIdempotencyKey();
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result: ApiResponse<T> = await response.json();

      if (!response.ok) {
        // For server errors, try retry
        if (response.status >= 500 && retryCount < RETRY_CONFIG.maxRetries && isGetRequest) {
          const delay = Math.min(
            RETRY_CONFIG.baseDelay * Math.pow(2, retryCount),
            RETRY_CONFIG.maxDelay
          );
          await sleep(delay);
          return this.request<T>(endpoint, options, retryCount + 1);
        }
      }

      return result;
    } catch (error) {
      console.error('API request failed:', error);

      // Handle network errors with retry for GET requests
      if (retryCount < RETRY_CONFIG.maxRetries && isGetRequest) {
        const delay = Math.min(
          RETRY_CONFIG.baseDelay * Math.pow(2, retryCount),
          RETRY_CONFIG.maxDelay
        );
        await sleep(delay);
        return this.request<T>(endpoint, options, retryCount + 1);
      }

      // Return user-friendly error
      return {
        ok: false,
        error: {
          code: error.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR',
          message: this.getErrorMessage(error.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR'),
        },
      };
    }
  }

  private getErrorMessage(code: string): string {
    return ERROR_MESSAGES[code] || 'Erro desconhecido.';
  }

  // Health check
  async health(): Promise<ApiResponse<{ version: string; timestamp: string }>> {
    return this.request('/api-health');
  }

  // OS endpoints
  async createOS(data: any): Promise<ApiResponse<any>> {
    // Normalize phone numbers in client data
    if (data.cliente && data.cliente.telefone) {
      data.cliente.telefone = this.normalizePhone(data.cliente.telefone);
    }
    
    return this.request('/api-os', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        usuario_id: getUserId(),
      }),
    });
  }

  async getOS(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api-os/${id}`);
  }

  async listOS(params?: {
    status?: string;
    date_from?: string;
    date_to?: string;
    query?: string;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<{ items: any[]; pagination: any }>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    return this.request(`/api-os${queryString ? `?${queryString}` : ''}`);
  }

  async updateOS(id: string, data: any): Promise<ApiResponse<any>> {
    // Normalize phone numbers in client data
    if (data.cliente && data.cliente.telefone) {
      data.cliente.telefone = this.normalizePhone(data.cliente.telefone);
    }
    
    return this.request(`/api-os/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...data,
        usuario_id: getUserId(),
      }),
    });
  }

  async deleteOS(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    return this.request(`/api-os/${id}`, {
      method: 'DELETE',
    });
  }

  async syncOS(changes: any[]): Promise<ApiResponse<{ applied: string[]; conflicts: any[] }>> {
    return this.request('/api-os/sync', {
      method: 'POST',
      body: JSON.stringify({
        usuario_id: getUserId(),
        changes,
      }),
    });
  }

  // Client endpoints
  async createClient(data: any): Promise<ApiResponse<any>> {
    return this.request('/api-clientes', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        telefone: this.normalizePhone(data.telefone),
      }),
    });
  }

  async getClient(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api-clientes/${id}`);
  }

  async listClients(params?: {
    query?: string;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<{ items: any[]; pagination: any }>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    return this.request(`/api-clientes${queryString ? `?${queryString}` : ''}`);
  }

  async updateClient(id: string, data: any): Promise<ApiResponse<any>> {
    return this.request(`/api-clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...data,
        telefone: this.normalizePhone(data.telefone),
      }),
    });
  }

  async deleteClient(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    return this.request(`/api-clientes/${id}`, {
      method: 'DELETE',
    });
  }

  // OpenAI key management
  async saveOpenAIKey(apiKey: string): Promise<ApiResponse<{ saved: boolean }>> {
    return this.request('/user-openai-key', {
      method: 'POST',
      body: JSON.stringify({
        usuario_id: getUserId(),
        openai_api_key: apiKey,
      }),
    });
  }

  async testOpenAIKey(): Promise<ApiResponse<{ openai_key_ok: boolean }>> {
    return this.request('/user-openai-key/test', {
      method: 'POST',
      body: JSON.stringify({
        usuario_id: getUserId(),
      }),
    });
  }

  // Helper to normalize phone to E.164
  private normalizePhone(phone: string): string {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // If starts with 55 (Brazil), format as +55
    if (digits.startsWith('55') && digits.length >= 12) {
      return `+${digits}`;
    }
    
    // If doesn't start with country code, assume Brazil
    if (digits.length >= 10) {
      return `+55${digits}`;
    }
    
    return `+55${digits}`;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export types and utilities
export { getUserId, isOnline };
export type { ApiResponse };