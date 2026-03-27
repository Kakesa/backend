import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Users,
    AlertCircle,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Loader2
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from "recharts";
import { apiGetFinanceDashboardStats } from "@/services/api/finance.api";
import { FinanceStats } from "@/types/finance.types";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

export default function FinanceDashboard() {
    const [stats, setStats] = useState<FinanceStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await apiGetFinanceDashboardStats();
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch finance stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!stats) return null;

    const trendData = stats.trends.incomeTrend.map((inc, index) => {
        const exp = stats.trends.expenseTrend[index]?.amount || 0;
        const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
        return {
            name: monthNames[inc._id.month - 1],
            income: inc.amount,
            expense: exp,
            profit: inc.amount - exp
        };
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord Finance</h1>
                <p className="text-muted-foreground">Vue d'ensemble des revenus, dépenses et santé financière.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-green-50/50 border-green-100">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Revenus Totaux</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700">{stats.totals.income.toLocaleString()} $</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            <span className="text-green-600 font-medium flex items-center gap-1">
                                <ArrowUpRight className="h-3 w-3" />
                                Dernier mois: {stats.totals.monthlyIncome.toLocaleString()} $
                            </span>
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-red-50/50 border-red-100">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Dépenses Totales</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700">{stats.totals.expenses.toLocaleString()} $</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            <span className="text-red-600 font-medium flex items-center gap-1">
                                <ArrowDownRight className="h-3 w-3" />
                                Ce mois: {stats.totals.monthlyExpenses.toLocaleString()} $
                            </span>
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-blue-50/50 border-blue-100">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Solde Actuel</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-700">{stats.totals.balance.toLocaleString()} $</div>
                        <p className="text-xs text-muted-foreground mt-1">Trésorerie disponible</p>
                    </CardContent>
                </Card>

                <Card className="bg-orange-50/50 border-orange-100">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Élèves Débiteurs</CardTitle>
                        <Users className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-700">{stats.debtorsCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">Paiements en attente</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-7">
                <Card className="md:col-span-4">
                    <CardHeader>
                        <CardTitle>Évolution Flux de Trésorerie</CardTitle>
                        <CardDescription>Comparaison mensuelle des entrées et sorties (6 derniers mois)</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    formatter={(value: any) => [`$${value.toLocaleString()}`, '']}
                                />
                                <Area type="monotone" dataKey="income" stroke="#22c55e" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} name="Revenus" />
                                <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} name="Dépenses" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="md:col-span-3">
                    <CardHeader className="flex items-center justify-between">
                        <div>
                            <CardTitle>Profit Mensuel</CardTitle>
                            <CardDescription>Solde net par mois</CardDescription>
                        </div>
                        <Link to="/dashboard/finance/journal" className="text-xs text-primary hover:underline">
                            Voir le journal des écritures
                        </Link>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    formatter={(value: any) => [`$${value.toLocaleString()}`, 'Net']}
                                />
                                <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                                    {trendData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? "#3b82f6" : "#f43f5e"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
