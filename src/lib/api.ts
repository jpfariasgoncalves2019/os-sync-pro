const API_BASE_URL = '/api';

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
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
    return this.post('/api-clientes', data);
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