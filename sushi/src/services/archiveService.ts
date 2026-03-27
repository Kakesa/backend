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

export interface ArchivedDocument {
  id: string;
  title: string;
  type: 'bulletin' | 'report' | 'certificate' | 'transcript' | 'other';
  studentName: string;
  className: string;
  academicYear: string;
  date: string;
  fileUrl: string;
  size: string;
  fileName: string;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ArchiveFilters {
  class?: string;
  year?: string;
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ArchiveResponse {
  data: ArchivedDocument[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ArchiveStats {
  total: number;
  byType: {
    bulletin: number;
    report: number;
    certificate: number;
    transcript: number;
    other: number;
  };
  byYear: {
    [key: string]: number;
  };
  totalSize: string;
}

// Récupérer les documents archivés
export const getArchivedDocuments = async (filters?: ArchiveFilters): Promise<ArchiveResponse> => {
  const params = new URLSearchParams();
  
  if (filters?.class) params.append('class', filters.class);
  if (filters?.year) params.append('year', filters.year);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const response = await api.get(`/archive?${params.toString()}`);
  return response.data;
};

// Rechercher des documents (admin/teacher)
export const searchArchivedDocuments = async (searchTerm: string, filters?: ArchiveFilters): Promise<ArchiveResponse> => {
  const params = new URLSearchParams();
  params.append('search', searchTerm);
  
  if (filters?.class) params.append('class', filters.class);
  if (filters?.year) params.append('year', filters.year);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const response = await api.get(`/archive/search?${params.toString()}`);
  return response.data;
};

// Récupérer les archives d'un étudiant spécifique (admin/teacher)
export const getStudentArchives = async (studentId: string, filters?: ArchiveFilters): Promise<ArchiveResponse> => {
  const params = new URLSearchParams();
  
  if (filters?.year) params.append('year', filters.year);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const response = await api.get(`/archive/student/${studentId}?${params.toString()}`);
  return response.data;
};

// Télécharger un document archivé
export const downloadArchivedDocument = async (documentId: string): Promise<Blob> => {
  const response = await api.get(`/archive/download/${documentId}`, {
    responseType: 'blob',
  });
  return response.data;
};

// Visualiser un document archivé
export const viewArchivedDocument = async (documentId: string): Promise<string> => {
  const response = await api.get(`/archive/view/${documentId}`);
  return response.data.data.fileUrl;
};

// Uploader un document archivé (admin/teacher)
export const uploadArchivedDocument = async (formData: FormData): Promise<ArchivedDocument> => {
  const response = await api.post('/archive/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
};

// Mettre à jour un document archivé (admin/teacher)
export const updateArchivedDocument = async (documentId: string, data: Partial<ArchivedDocument>): Promise<ArchivedDocument> => {
  const response = await api.put(`/archive/${documentId}`, data);
  return response.data.data;
};

// Supprimer un document archivé (admin/teacher)
export const deleteArchivedDocument = async (documentId: string): Promise<void> => {
  await api.delete(`/archive/${documentId}`);
};

// Récupérer les statistiques des archives (admin/teacher)
export const getArchiveStats = async (): Promise<ArchiveStats> => {
  const response = await api.get('/archive/stats');
  return response.data.data;
};

// Téléchargement en masse (admin/teacher)
export const bulkDownloadArchives = async (documentIds: string[]): Promise<Blob> => {
  const response = await api.post('/archive/bulk-download', { documentIds }, {
    responseType: 'blob',
  });
  return response.data;
};
