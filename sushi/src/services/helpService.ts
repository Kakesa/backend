import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Créer une instance axios avec configuration par défaut
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types TypeScript pour les demandes d'aide
export interface HelpRequest {
  id: string;
  type: 'complaint' | 'feature' | 'bug' | 'question';
  subject: string;
  description: string;
  status: 'pending' | 'in-progress' | 'resolved';
  userType: 'admin' | 'teacher' | 'student' | 'parent';
  userName: string;
  userEmail: string;
  userId: string;
  schoolId: string;
  response?: string;
  adminResponse?: string;
  readByUser?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateHelpRequest {
  type: 'complaint' | 'feature' | 'bug' | 'question';
  subject: string;
  description: string;
}

export interface HelpRequestFilters {
  status?: string;
  type?: string;
  userType?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface HelpRequestStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  byType: {
    complaint: number;
    feature: number;
    bug: number;
    question: number;
  };
}

// Services API pour les demandes d'aide
export const helpService = {
  // Créer une nouvelle demande d'aide
  async createRequest(data: CreateHelpRequest): Promise<HelpRequest> {
    const response = await api.post('/help', data);
    return response.data.data;
  },

  // Récupérer les demandes de l'utilisateur connecté
  async getMyRequests(): Promise<HelpRequest[]> {
    const response = await api.get('/help/my-requests');
    return response.data.data;
  },

  // Récupérer les demandes d'un utilisateur spécifique
  async getUserRequests(userId: string): Promise<HelpRequest[]> {
    const response = await api.get(`/help/user/${userId}`);
    return response.data.data;
  },

  // Marquer une demande comme lue par l'utilisateur
  async markAsRead(id: string): Promise<HelpRequest> {
    const response = await api.put(`/help/${id}/mark-read`);
    return response.data.data;
  },

  // Marquer toutes les demandes de l'utilisateur comme lues
  async markAllAsRead(): Promise<void> {
    await api.put('/help/mark-all-read');
  },

  // Récupérer toutes les demandes (superadmin)
  async getAllRequests(filters?: HelpRequestFilters): Promise<{
    data: HelpRequest[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.userType) params.append('userType', filters.userType);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/help?${params.toString()}`);
    return response.data;
  },

  // Mettre à jour une demande (superadmin)
  async updateRequest(id: string, data: {
    status: 'pending' | 'in-progress' | 'resolved';
    adminResponse?: string;
  }): Promise<HelpRequest> {
    const response = await api.put(`/help/${id}`, data);
    return response.data.data;
  },

  // Récupérer les statistiques (superadmin)
  async getStats(): Promise<HelpRequestStats> {
    const response = await api.get('/help/stats');
    return response.data.data;
  },
};

export default api;
