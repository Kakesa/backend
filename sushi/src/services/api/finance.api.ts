import api from "./client";
import { Expense, FinanceStats, FinanceJournalEntry } from "@/types/finance.types";

export const apiGetFinanceDashboardStats = async (): Promise<FinanceStats> => {
    const response = await api.get("/finance/dashboard");
    return response.data.data;
};

export const apiGetAllExpenses = async (params?: any): Promise<Expense[]> => {
    const response = await api.get("/expenses", { params });
    return response.data.data;
};

export const apiCreateExpense = async (data: Partial<Expense>): Promise<Expense> => {
    const response = await api.post("/expenses", data);
    return response.data.data;
};

export const apiUpdateExpense = async (id: string, data: Partial<Expense>): Promise<Expense> => {
    const response = await api.put(`/expenses/${id}`, data);
    return response.data.data;
};

export const apiDeleteExpense = async (id: string): Promise<void> => {
    await api.delete(`/expenses/${id}`);
};

export const apiGetExpenseStats = async (): Promise<any[]> => {
    const response = await api.get("/expenses/stats");
    return response.data.data;
};

export const apiGetFinanceJournal = async (): Promise<FinanceJournalEntry[]> => {
    const response = await api.get("/finance/journal");
    return response.data.data;
};
