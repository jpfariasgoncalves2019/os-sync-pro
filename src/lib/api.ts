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
    const queryString = filters ? new URLSearchParams(filters).toString() : '';
    return this.get(`/api-os${queryString ? `?${queryString}` : ''}`);
  }

  async getOS(id: string): Promise<ApiResponse<any>> {
    return this.get(`/api-os/${id}`);
  }

  async createOS(data: any): Promise<ApiResponse<any>> {
    return this.post('/api-os', data);
  }

  async updateOS(id: string, data: any): Promise<ApiResponse<any>> {
    return this.put(`/api-os/${id}`, data);
  }

  async deleteOS(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/api-os/${id}`);
  }

  // Métodos específicos para Clientes
  async listClients(filters?: any): Promise<ApiResponse<any>> {
    const queryString = filters ? new URLSearchParams(filters).toString() : '';
    return this.get(`/api-clientes${queryString ? `?${queryString}` : ''}`);
  }


  async createClient(data: any): Promise<ApiResponse<any>> {
    // Detecta ambiente de produção Netlify
    const isProd = typeof window !== 'undefined' && window.location.hostname.endsWith('netlify.app');
    if (isProd) {
      // Usa a URL pública da função Supabase
      return this.request<any>(
        `${SUPABASE_FUNCTIONS_URL}/api-clientes`,
        {
          method: 'POST',
          body: data ? JSON.stringify(data) : undefined,
        },
        true
      );
    } else {
      // Ambiente local/dev: usa proxy /api
      return this.post('/api-clientes', data);
    }
  }

  async updateClient(id: string, data: any): Promise<ApiResponse<any>> {
    return this.put(`/api-clientes/${id}`, data);
  }

  async deleteClient(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/api-clientes/${id}`);
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