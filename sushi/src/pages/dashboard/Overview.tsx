import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, BookOpen, ClipboardCheck, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { apiGetAllStudents } from "@/services/api/students.api";
import { apiGetAllTeachers } from "@/services/api/teachers.api";
import { apiGetAllClasses } from "@/services/api/classes.api";
import { apiGetAllCourses } from "@/services/api/courses.api";

const attendanceData: { day: string; present: number; absent: number }[] = [];
const gradeDistribution: { name: string; value: number; color: string }[] = [];
const recentActivities: { action: string; name: string; time: string }[] = [];

export default function Overview() {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    courses: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [students, teachers, classes, courses] = await Promise.all([
          apiGetAllStudents(),
          apiGetAllTeachers(),
          apiGetAllClasses(),
          apiGetAllCourses()
        ]);
        setCounts({
          students: students.length,
          teachers: teachers.length,
          classes: classes.length,
          courses: courses.length
        });
      } catch (err) {
        console.error("Failed to fetch overview stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    {
      title: "Total Élèves",
      value: counts.students.toLocaleString(),
      change: "+12%",
      trend: "up",
      icon: Users,
      color: "from-blue-500 to-blue-600",
      iconBg: "bg-white/20",
      textColor: "text-white"
    },
    {
      title: "Professeurs",
      value: counts.teachers.toLocaleString(),
      change: "+3",
      trend: "up",
      icon: GraduationCap,
      color: "from-green-500 to-green-600",
      iconBg: "bg-white/20",
      textColor: "text-white"
    },
    {
      title: "Classes",
      value: counts.classes.toLocaleString(),
      change: "+2",
      trend: "up",
      icon: BookOpen,
      color: "from-purple-500 to-purple-600",
      iconBg: "bg-white/20",
      textColor: "text-white"
    },
    {
      title: "Cours actifs",
      value: counts.courses.toLocaleString(),
      change: "+5",
      trend: "up",
      icon: ClipboardCheck,
      color: "from-orange-500 to-orange-600",
      iconBg: "bg-white/20",
      textColor: "text-white"
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground">Vue d'ensemble de votre établissement</p>
        </div>
        {loading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
      </div>

      {/* Stats Cards - Style Preskool */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className={`relative overflow-hidden border-0 shadow-lg bg-gradient-to-br ${stat.color} ${stat.textColor}`}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-bl-full" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className={`text-sm font-medium text-white/90`}>
                {stat.title}
              </CardTitle>
              <div className={`p-2 ${stat.iconBg} rounded-lg`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <div className="flex items-center text-xs mt-2">
                {stat.trend === "up" ? (
                  <TrendingUp className="mr-1 h-3 w-3 text-green-300" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3 text-red-300" />
                )}
                <span className={stat.trend === "up" ? "text-green-300" : "text-red-300"}>
                  {stat.change}
                </span>
                <span className="ml-1 text-white/70">vs mois dernier</span>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-white/70">En temps réel</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts - Style Preskool */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Présences de la semaine
            </CardTitle>
            <CardDescription className="text-blue-700">Suivi quotidien des présences</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis dataKey="day" className="text-xs" tick={{ fill: '#64748b' }} />
                <YAxis className="text-xs" tick={{ fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Bar dataKey="present" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Présents" />
                <Bar dataKey="absent" fill="#ef4444" radius={[8, 8, 0, 0]} name="Absents" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b">
            <CardTitle className="text-purple-900 flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Répartition des notes
            </CardTitle>
            <CardDescription className="text-purple-700">Distribution des performances</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={gradeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {gradeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              {gradeDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {item.name} ({item.value}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities - Style Preskool */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b">
          <CardTitle className="text-green-900 flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Répartition des notes
          </CardTitle>
          <CardDescription className="text-purple-700">Distribution des performances</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={gradeDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {gradeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {gradeDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-muted-foreground">
                  {item.name} ({item.value}%)
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities - Style Preskool */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b">
          <CardTitle className="text-green-900 flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Activités récentes
          </CardTitle>
          <CardDescription className="text-green-700">Les dernières actions effectuées</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <ClipboardCheck className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.name}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
            {recentActivities.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ClipboardCheck className="h-10 w-10 text-green-200 mb-3" />
                <p className="text-sm text-muted-foreground">Aucune activité récente</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Les actions effectuées apparaîtront ici
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
