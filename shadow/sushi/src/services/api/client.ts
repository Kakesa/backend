// ==========================================
// API CLIENT - Configuration Axios
// ==========================================

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import { ApiResponse, ApiError } from "@/types";
import { validateRequestData, handleObjectIdError } from "@/utils/apiValidation";

// 🌍 Base URL depuis .env
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Création de l'instance Axios
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ==========================================
// INTERCEPTOR REQUEST
// ==========================================
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const schoolId = localStorage.getItem("currentSchoolId");
    if (schoolId) {
      config.headers["X-School-Id"] = schoolId;
    }

    // Validate request data for courseId compatibility
    if (config.data) {
      config.data = validateRequestData(config.data);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================================
// INTERCEPTOR RESPONSE
// ==========================================
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ApiError>) => {
    // Handle ObjectId validation errors
    const processedError = handleObjectIdError(error);

    if (processedError.response) {
      const { status, data } = processedError.response;

      if (status === 401) {
        removeAuthToken();
        window.location.href = "/login";
      }

      // Si c'est une erreur 400, logger les détails pour le debug
      if (status === 400) {
        console.error('API Error 400 Details:', {
          status,
          data,
          config: error.config,
          headers: error.config?.headers
        });
      }

      // If it's an ObjectId error, provide helpful information
      if (processedError.isObjectIdError) {
        console.error('ObjectId Validation Error:', {
          invalidId: processedError.invalidCourseId,
          suggestedId: processedError.suggestedCourseId,
          originalError: processedError.message,
        });
      }

      return Promise.reject(
        data || {
          code: processedError.isObjectIdError ? "OBJECTID_ERROR" : "API_ERROR",
          message: processedError.message || "Une erreur est survenue",
        }
      );
    }

    if (error.request) {
      return Promise.reject({
        code: "NETWORK_ERROR",
        message: "Le serveur ne répond pas",
      });
    }

    return Promise.reject({
      code: "UNKNOWN_ERROR",
      message: error.message,
    });
  }
);

// ==========================================
// API HELPERS
// ==========================================
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<ApiResponse<T>>(url, config),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.post<ApiResponse<T>>(url, data, config),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.put<ApiResponse<T>>(url, data, config),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.patch<ApiResponse<T>>(url, data, config),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<ApiResponse<T>>(url, config),
};

export default apiClient;

// ==========================================
// TOKEN HELPERS
// ==========================================
export const setAuthToken = (token: string) =>
  localStorage.setItem("authToken", token);

export const getAuthToken = () => localStorage.getItem("authToken");

export const removeAuthToken = () =>
  localStorage.removeItem("authToken");

// ==========================================
// SCHOOL HELPERS
// ==========================================
export const setCurrentSchoolId = (schoolId: string) =>
  localStorage.setItem("currentSchoolId", schoolId);

export const getCurrentSchoolId = () =>
  localStorage.getItem("currentSchoolId");

// ==========================================
// UPLOAD HELPERS
// ==========================================
export const uploadFile = (
  endpoint: string,
  file: File,
  additionalData?: Record<string, string>
) => {
  const formData = new FormData();
  formData.append("file", file);

  if (additionalData) {
    Object.entries(additionalData).forEach(([k, v]) =>
      formData.append(k, v)
    );
  }

  return apiClient.post(endpoint, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const uploadMultipleFiles = (
  endpoint: string,
  files: File[],
  additionalData?: Record<string, string>
) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  if (additionalData) {
    Object.entries(additionalData).forEach(([k, v]) =>
      formData.append(k, v)
    );
  }

  return apiClient.post(endpoint, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
