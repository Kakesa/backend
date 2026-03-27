/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from "./client";
import { ApiResponse } from "@/types/api.types";

export interface FeeDefinition {
  id: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  category: "TUITION" | "TRANSPORT" | "CANTEEN" | "OTHER";
  dueDate?: string;
  academicYear: string;
  targetClasses: string[];
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
}

export interface StudentFee {
  id: string;
  studentId: any; // Populated
  feeDefinitionId: FeeDefinition;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE";
  lastReminderDate?: string;
}

export interface PaymentRecords {
  id: string;
  studentId: string;
  amount: number;
  paymentDate: string;
  method: "CASH" | "BANK_TRANSFER" | "MOBILE_MONEY" | "CREDIT_CARD";
  reference?: string;
}

/* =====================================================
   ADMIN API
===================================================== */

export const apiCreateFeeDefinition = async (
  data: Partial<FeeDefinition>,
): Promise<FeeDefinition> => {
  const response = await api.post<FeeDefinition>("/fees/definitions", data);
  return response.data.data;
};

export const apiGetAllFeeStatuses = async (
  params: { classId?: string; status?: string } = {},
): Promise<StudentFee[]> => {
  const response = await api.get<StudentFee[]>("/fees/status", {
    params,
  });
  return response.data.data;
};

export const apiRecordPayment = async (data: {
  studentFeeId: string;
  amount: number;
  method: string;
  reference?: string;
}): Promise<any> => {
  const response = await api.post<any>("/fees/payments", data);
  return response.data.data;
};

export const apiSendFeeReminder = async (
  studentFeeId: string,
): Promise<boolean> => {
  const response = await api.post<any>(`/fees/reminders/${studentFeeId}`);
  return response.data.success;
};

/* =====================================================
   STUDENT / PARENT / TEACHER API
===================================================== */

export const apiGetStudentFees = async (
  studentId: string,
): Promise<StudentFee[]> => {
  const response = await api.get<StudentFee[]>(`/fees/student/${studentId}`);
  return response.data.data;
};

export const apiGetMyFees = async (): Promise<StudentFee[]> => {
  const response = await api.get<StudentFee[]>("/fees/me");
  return response.data.data;
};

export const apiGetMyChildrenFees = async (): Promise<any[]> => {
  const response = await api.get<any[]>("/fees/children");
  return response.data.data;
};

export const apiGetClassFeeStatus = async (
  classId?: string,
): Promise<any[]> => {
  const response = await api.get<any[]>("/fees/class-status", {
    params: { classId },
  });
  return response.data.data;
};
export const apiInitiateMobilePayment = async (data: {
  studentFeeId: string;
  amount: number;
  phoneNumber: string;
  provider: string;
}): Promise<any> => {
  const response = await api.post<any>("/payments/initiate-mobile", data);
  return response.data.data;
};

export const apiGetPaymentHistory = async (
  studentId?: string,
  studentFeeId?: string,
): Promise<PaymentRecords[]> => {
  const response = await api.get<PaymentRecords[]>("/payments/history", {
    params: { studentId, studentFeeId },
  });
  return response.data.data;
};

export const apiDownloadPaymentReceipt = async (
  paymentId: string,
): Promise<Blob> => {
  const response = await api.get(`/payments/receipt/${paymentId}`, {
    responseType: 'blob',
  });
  return response.data;
};

export const apiCreatePaymentPlan = async (data: {
  studentFeeId: string;
  installments: Array<{
    dueDate: string;
    amount: number;
    description?: string;
  }>;
}): Promise<any> => {
  const response = await api.post<any>("/payments/plans", data);
  return response.data.data;
};

export const apiGetPaymentPlans = async (
  studentId?: string,
): Promise<any[]> => {
  const response = await api.get<any[]>("/payments/plans", {
    params: { studentId },
  });
  return response.data.data;
};
