const API_BASE_URL = '/api';
const SUPABASE_FUNCTIONS_URL =
  'https://ppxexzbmaepudhkqfozt.supabase.co/functions/v1';

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

class ApiClient {
  private generateIdempotencyKey(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    absoluteUrl = false
  ): Promise<ApiResponse<T>> {
    try {
      const url = absoluteUrl ? endpoint : `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': this.generateIdempotencyKey(),
          ...options.headers,
        },
        ...options,
      });
      return await response.json();
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Erro de conexão. Verifique sua internet.',
        },
      };
    }
  }

  // --- Configuração da Empresa ---
  async getEmpresaConfig(token: string): Promise<ApiResponse<any>> {
    return this.request<any>(
      `${SUPABASE_FUNCTIONS_URL}/api-configuracoes`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      },
      true
    );
  }

  async saveEmpresaConfig(data: any, token: string): Promise<ApiResponse<any>> {
    return this.request<any>(
      `${SUPABASE_FUNCTIONS_URL}/api-configuracoes`,
      {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { Authorization: `Bearer ${token}` },
      },
      true
    );
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Métodos específicos para OS
  async listOS(filters?: any): Promise<ApiResponse<any>> {
    // Filtrar parâmetros undefined
    const cleanFilters = Object.fromEntries(
      Object.entries(filters || {}).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );
    const queryString = Object.keys(cleanFilters).length > 0 ? new URLSearchParams(cleanFilters as Record<string, string>).toString() : '';
    
    return this.request<any>(
      `${SUPABASE_FUNCTIONS_URL}/api-os${queryString ? `?${queryString}` : ''}`,
      { method: 'GET' },
      true
    );
  }

  async getOS(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(
      `${SUPABASE_FUNCTIONS_URL}/api-os/${id}`,
      { method: 'GET' },
      true
    );
  }

  async createOS(data: any): Promise<ApiResponse<any>> {
    return this.request<any>(
      `${SUPABASE_FUNCTIONS_URL}/api-os`,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      true
    );
  }

  async updateOS(id: string, data: any): Promise<ApiResponse<any>> {
    return this.request<any>(
      `${SUPABASE_FUNCTIONS_URL}/api-os/${id}`,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      true
    );
  }

  async deleteOS(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(
      `${SUPABASE_FUNCTIONS_URL}/api-os/${id}`,
      { method: 'DELETE' },
      true
    );
  }

  // Métodos específicos para Clientes

  async listClients(filters?: any): Promise<ApiResponse<any>> {
    // Filtrar parâmetros undefined
    const cleanFilters = Object.fromEntries(
      Object.entries(filters || {}).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );
    const queryString = Object.keys(cleanFilters).length > 0 ? new URLSearchParams(cleanFilters as Record<string, string>).toString() : '';
    
    return this.request<any>(
      `${SUPABASE_FUNCTIONS_URL}/api-clientes${queryString ? `?${queryString}` : ''}`,
      { method: 'GET' },
      true
    );
  }

  async createClient(data: any): Promise<ApiResponse<any>> {
    return this.request<any>(
      `${SUPABASE_FUNCTIONS_URL}/api-clientes`,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      true
    );
  }

  async updateClient(id: string, data: any): Promise<ApiResponse<any>> {
    return this.request<any>(
      `${SUPABASE_FUNCTIONS_URL}/api-clientes/${id}`,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      true
    );
  }

  async deleteClient(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(
      `${SUPABASE_FUNCTIONS_URL}/api-clientes/${id}`,
      { method: 'DELETE' },
      true
    );
  }

  // Métodos para OpenAI
  async testOpenAIKey(key: string): Promise<ApiResponse<any>> {
    return this.post('/user-openai-key/test', { key });
  }

  async saveOpenAIKey(key: string): Promise<ApiResponse<any>> {
    return this.post('/user-openai-key', { key });
  }
}

export const apiClient = new ApiClient();