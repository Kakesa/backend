/**
 * Données pour le super-admin
 */

export const mobileMoneyPayments = [
  {
    id: "1",
    amount: 50000,
    currency: "XOF",
    provider: "Orange Money",
    phoneNumber: "+224620000000",
    date: "2024-03-15",
    status: "completed",
    schoolName: "École Primaire Excellence"
  },
  {
    id: "2", 
    amount: 75000,
    currency: "XOF",
    provider: "MTN Money",
    phoneNumber: "+224630000000",
    date: "2024-03-14",
    status: "pending",
    schoolName: "Lycée Scientifique Innovation"
  },
  {
    id: "3",
    amount: 100000,
    currency: "XOF", 
    provider: "Wave",
    phoneNumber: "+224640000000",
    date: "2024-03-13",
    status: "completed",
    schoolName: "Collège Arts & Culture"
  }
];

export const superadminStats = {
  totalSchools: 156,
  activeSchools: 142,
  totalStudents: 45678,
  totalTeachers: 2341,
  totalRevenue: 2500000000,
  monthlyRevenue: 208333333,
  newSchoolsThisMonth: 8,
  activeSubscriptions: 142
};

// Fonctions pour les statistiques
export const getMonthlyStats = () => {
  const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  return months.map((month, index) => ({
    month,
    revenue: Math.floor(Math.random() * 50000000) + 10000000,
    schools: Math.floor(Math.random() * 20) + 5,
    students: Math.floor(Math.random() * 1000) + 200
  }));
};

export const getRevenueByPlan = () => [
  { plan: "Basic", revenue: 50000000, percentage: 20 },
  { plan: "Standard", revenue: 125000000, percentage: 50 },
  { plan: "Premium", revenue: 75000000, percentage: 30 }
];

export const getGlobalStats = () => superadminStats;

export const getMobileMoneyPayments = () => mobileMoneyPayments;
