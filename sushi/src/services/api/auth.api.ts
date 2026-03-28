// ==========================================
// AUTH API
// ==========================================

import { api, setAuthToken, removeAuthToken } from "./client";
import type { User, LoginDTO, RegisterDTO, ChangePasswordDTO } from "@/types";
import type { AuthResponse, ApiResponse } from "@/types";

// POST /auth/login
export const apiLogin = async (
  credentials: LoginDTO,
): Promise<AuthResponse> => {
  const response = await api.post<ApiResponse<AuthResponse>>(
    "/auth/login",
    credentials,
  );

  const data = response.data.data;
  if (!data) throw new Error(response.data.message || "Login failed");

  if (data.token) {
    setAuthToken(data.token);
  }

  return data;
};

// POST /auth/logout
export const apiLogout = async (): Promise<void> => {
  await api.post("/auth/logout");
  removeAuthToken();
};

// POST /auth/register
export const apiRegister = async (data: RegisterDTO): Promise<AuthResponse> => {
  const response = await api.post<ApiResponse<AuthResponse>>(
    "/auth/register",
    data,
  );

  if (!response.data.data)
    throw new Error(response.data.message || "Register failed");
  return response.data.data;
};

// POST /auth/reset-password
export const apiResetPassword = async (
  email: string,
): Promise<{ success: boolean; message?: string }> => {
  const response = await api.post<
    ApiResponse<{ success: boolean; message?: string }>
  >("/auth/reset-password", { email });

  if (!response.data.data)
    throw new Error(response.data.message || "Reset failed");
  return response.data.data;
};

// POST /auth/change-password
export const apiChangePassword = async (
  oldPassword: string,
  newPassword: string,
): Promise<{ success: boolean; message?: string }> => {
  const response = await api.post<
    ApiResponse<{ success: boolean; message?: string }>
  >("/auth/change-password", { oldPassword, newPassword });

  return {
    success: response.data.success,
    message: response.data.message,
  };
};

// POST /auth/refresh-token
export const apiRefreshToken = async (): Promise<AuthResponse> => {
  const response = await api.post<ApiResponse<AuthResponse>>(
    "/auth/refresh-token",
  );

  const data = response.data.data;
  if (!data) throw new Error(response.data.message || "Refresh token failed");

  if (data.token) {
    setAuthToken(data.token);
  }

  return data;
};

// POST /auth/activate-otp
export const apiActivateAccount = async (
  email: string,
  code: string,
): Promise<AuthResponse> => {
  const response = await api.post<ApiResponse<AuthResponse>>(
    "/auth/activate-otp",
    { email, code },
  );

  if (!response.data.data)
    throw new Error(response.data.message || "Activation failed");
  return response.data.data;
};

// POST /auth/resend-otp
export const apiResendOTP = async (
  email: string,
): Promise<{ message: string }> => {
  const response = await api.post<ApiResponse<{ message: string }>>(
    "/auth/resend-otp",
    { email },
  );

  const data = response.data.data;
  return { message: data?.message || response.data.message || "OTP envoyé" };
};

// POST /auth/create-school (for admin after activation)
export const apiAuthCreateSchool = async (
  name: string,
): Promise<{ schoolCode: string; school: unknown }> => {
  const response = await api.post<{ schoolCode: string; school: unknown }>(
    "/auth/create-school",
    { name },
  );

  const result = response.data;
  if (!result.data) throw new Error(result.message || "Create school failed");
  return result.data as { schoolCode: string; school: unknown };
};

// POST /auth/schools/join (for teacher, student, parent)
export const apiJoinSchool = async (
  schoolCode: string,
): Promise<{ schoolId: string; schoolName: string; message: string }> => {
  const response = await api.post("/auth/schools/join", { schoolCode });

  const result = response.data.data as { schoolId: string; schoolName: string; message: string } | undefined;
  if (!result) throw new Error(response.data.message || "Join school failed");
  return result;
};

// GET /schools/current/joined-users - Get history of users who joined with code
export interface JoinedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
}

export const apiGetJoinedUsersHistory = async (): Promise<JoinedUser[]> => {
  const response = await api.get<JoinedUser[]>("/schools/current/joined-users");
  const result = response.data;
  return (result.data as JoinedUser[]) || [];
};

// POST /auth/register-student - Student self-registration
export interface RegisterStudentDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone?: string;
}

export const apiRegisterStudent = async (
  data: RegisterStudentDTO,
): Promise<{ message: string; studentId: string }> => {
  const response = await api.post<
    ApiResponse<{ message: string; studentId: string }>
  >("/auth/register-student", data);

  const result = response.data.data;
  if (!result) throw new Error(response.data.message || "Registration failed");

  return {
    message: result.message || response.data.message || "Inscription réussie",
    studentId: result.studentId || "",
  };
};
