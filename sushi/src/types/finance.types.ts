export type ExpenseCategory =
    | "SALARY"
    | "UTILITIES"
    | "EQUIPMENT"
    | "MAINTENANCE"
    | "SUPPLIES"
    | "RENT"
    | "TAXES"
    | "OTHER";

export interface Expense {
    id: string;
    description: string;
    amount: number;
    currency: string;
    date: string;
    category: ExpenseCategory;
    recordedBy?: {
        id: string;
        firstName?: string;
        lastName?: string;
    };
    /** Nom de la personne qui a enregistré la dépense (côté back) */
    recordedByName?: string;
    attachment?: string;
    note?: string;
}

export interface FinanceStats {
    totalRevenue: number;
    totalExpenses: number;
    totalFees: number;
    pendingFees: number;
    totalStudents: number;
    paidStudents: number;
    unpaidStudents: number;
    monthlyRevenue: Array<{ month: string; revenue: number; expenses: number }>;
    feeCollection: Array<{ status: string; count: number; amount: number }>;
    recentTransactions: Array<{
        id: string;
        type: string;
        description: string;
        amount: number;
        date: string;
        status: string;
    }>;
}

export interface FinanceJournalEntry {
    id: string;
    type: "INCOME" | "EXPENSE";
    description: string;
    amount: number;
    date?: string;
    createdAt: string;
    student?: {
        id: string;
        name: string;
    };
    thirdParty?: string;
    performedBy?: {
        id: string;
        name?: string;
        firstName?: string;
        lastName?: string;
    };
    /** Pour les entrées de type EXPENSE : nom de la personne qui a enregistré (côté back) */
    recordedByName?: string;
}
