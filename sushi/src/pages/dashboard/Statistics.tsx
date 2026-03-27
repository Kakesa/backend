import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { TrendingUp, TrendingDown, Users, GraduationCap, BookOpen, Award, Loader2, Trophy, Medal } from "lucide-react";
import { apiGetAllClasses } from "@/services/api/classes.api";
import { apiGetAllStudents } from "@/services/api/students.api";
import { apiGetAllTeachers } from "@/services/api/teachers.api";
import { apiGetRanking, apiGetSchoolAverages } from "@/services/api/grades.api";
import { Class, StudentRank, SchoolAverage } from "@/types";
import { cn } from "@/lib/utils";

export default function Statistics() {
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("year");
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Class[]>([]);
  const [ranking, setRanking] = useState<StudentRank[]>([]);
  const [history, setHistory] = useState<SchoolAverage[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    avgGeneral: 0,
    avgEvolution: 0,
    successRate: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [classesData, studentsData, teachersData, rankingData, historyData] = await Promise.all([
          apiGetAllClasses(),
          apiGetAllStudents(),
          apiGetAllTeachers(),
          apiGetRanking({
            trimester: selectedPeriod === "year" ? undefined : selectedPeriod.replace("trimester", ""),
            classId: selectedClass === "all" ? undefined : selectedClass,
            limit: 10
          }),
          apiGetSchoolAverages()
        ]);

        setClasses(classesData);
        setRanking(rankingData);
        setHistory(historyData);

        const avgGeneral = rankingData.length > 0
          ? rankingData.reduce((acc, curr) => acc + curr.moyenne, 0) / rankingData.length
          : 0;

        setStats({
          totalStudents: studentsData.length,
          totalTeachers: teachersData.length,
          totalClasses: classesData.length,
          avgGeneral: Number(avgGeneral.toFixed(2)),
          avgEvolution: 1.2, // Still mock for evolution delta
          successRate: rankingData.filter(r => r.moyenne >= 10).length / (rankingData.length || 1) * 100,
        });
      } catch (err) {
        console.error("Failed to fetch statistics data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [selectedClass, selectedPeriod]);

  // Transform history for Recharts
  const evolutionData = history.map(h => ({
    month: `Trimestre ${h.trimester}`,
    moyenne: h.average,
    participation: 85 + h.trimester * 2, // Mock participation
    assiduite: 90 + h.trimester, // Mock assiduity
  }));

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-slate-400" />;
      case 3: return <Medal className="h-5 w-5 text-amber-600" />;
      default: return <span className="font-bold text-muted-foreground">{rank}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Statistiques & Palmarès</h1>
          <p className="text-muted-foreground">Analyse des performances et classement des élèves</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />}
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Toutes les classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id || c._id} value={c.id || c._id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trimester1">1er Trimestre</SelectItem>
              <SelectItem value="trimester2">2ème Trimestre</SelectItem>
              <SelectItem value="trimester3">3ème Trimestre</SelectItem>
              <SelectItem value="year">Année complète</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-2xl bg-primary p-3 shadow-lg shadow-primary/20">
              <Award className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-black text-primary">{stats.avgGeneral}/20</p>
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Moyenne Générale</p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-green-500/5 to-green-500/10">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-2xl bg-green-500 p-3 shadow-lg shadow-green-500/20">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-3xl font-black text-green-600">{stats.successRate.toFixed(1)}%</p>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Taux de passage</p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-blue-500/5 to-blue-500/10">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-2xl bg-blue-500 p-3 shadow-lg shadow-blue-500/20">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-3xl font-black text-blue-600">{stats.totalStudents}</p>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Effectif Total</p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-purple-500/5 to-purple-500/10">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-2xl bg-purple-500 p-3 shadow-lg shadow-purple-500/20">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-black text-purple-600">{ranking[0]?.lastName || "---"}</p>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Major de Promo</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="palmares" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="palmares" className="gap-2">
            <Trophy className="h-4 w-4" /> Palmarès
          </TabsTrigger>
          <TabsTrigger value="evolution" className="gap-2">
            <TrendingUp className="h-4 w-4" /> Évolution
          </TabsTrigger>
          <TabsTrigger value="classes" className="gap-2">
            <Users className="h-4 w-4" /> Par classe
          </TabsTrigger>
        </TabsList>

        <TabsContent value="palmares" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 shadow-xl border-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-xl font-bold">Top 10 des Éleves</CardTitle>
                  <CardDescription>Classement général basé sur les moyennes calculées</CardDescription>
                </div>
                <Trophy className="h-8 w-8 text-yellow-500 opacity-20" />
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-16">Rang</TableHead>
                      <TableHead>Élève</TableHead>
                      <TableHead>Classe</TableHead>
                      <TableHead className="text-right">Moyenne</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ranking.map((row) => (
                      <TableRow key={row.studentId} className="group hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                            {getRankIcon(row.rank)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold">{row.lastName} {row.firstName}</span>
                            <span className="text-xs text-muted-foreground">{row.matricule}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-medium bg-secondary/50">{row.class}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn(
                            "text-lg font-black tracking-tighter",
                            row.moyenne >= 15 ? "text-green-600" : row.moyenne >= 10 ? "text-primary" : "text-destructive"
                          )}>
                            {row.moyenne.toFixed(2)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {ranking.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">
                          Aucune donnée de classement pour cette période
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-none">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Visualisation du Top 10</CardTitle>
                <CardDescription>Performance comparative des majors</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={ranking} layout="vertical" margin={{ left: 10, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.1} />
                    <XAxis type="number" domain={[0, 20]} hide />
                    <YAxis
                      dataKey="lastName"
                      type="category"
                      width={100}
                      tick={{ fontSize: 12, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as StudentRank;
                          return (
                            <div className="bg-white p-3 shadow-2xl rounded-lg border-none ring-1 ring-black/5">
                              <p className="font-black text-sm">{data.lastName} {data.firstName}</p>
                              <p className="text-xs text-primary font-bold">{data.class}</p>
                              <p className="text-xl font-black mt-1">{data.moyenne}/20</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="moyenne"
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    >
                      {ranking.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? '#eab308' : index === 1 ? '#94a3b8' : index === 2 ? '#d97706' : '#6366f1'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="evolution" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Évolution de la Moyenne École</CardTitle>
                <CardDescription>Progression trimestrielle de la performance globale</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={evolutionData}>
                    <defs>
                      <linearGradient id="colorMoy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 20]} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="moyenne"
                      stroke="#6366f1"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorMoy)"
                      name="Moyenne École"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Participation & Assiduité</CardTitle>
                <CardDescription>Tendances de l'engagement des élèves</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis domain={[50, 100]} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="participation"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                      name="Participation (%)"
                    />
                    <Line
                      type="monotone"
                      dataKey="assiduite"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                      name="Assiduité (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance par niveau</CardTitle>
              <CardDescription>Comparaison des moyennes entre les différentes classes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {/* Mock data for this one as we would need a more complex aggregate from backend */}
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classes.slice(0, 10).map(c => ({ name: c.name, val: Math.random() * 5 + 10 }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 20]} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="val" fill="#6366f1" radius={[4, 4, 0, 0]} name="Moyenne de Classe" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
