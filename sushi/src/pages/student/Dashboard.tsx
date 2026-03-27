/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Calendar, CheckCircle, Clock, TrendingUp, Award } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiGetGradesByStudent, apiCalculateStudentAverage } from "@/services/api/grades.api";
import { apiGetAttendanceStats } from "@/services/api/attendance.api";
import { apiGetStudentCourses } from "@/services/api/students.api";
import { apiGetMyFees, StudentFee } from "@/services/api/fees.api";
import { Wallet } from "lucide-react";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [average, setAverage] = useState(0);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, late: 0, excused: 0 });
  const [recentGrades, setRecentGrades] = useState<any[]>([]);
  const [upcomingCourses, setUpcomingCourses] = useState<any[]>([]);
  const [fees, setFees] = useState<StudentFee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const studentId = user?.linkedId || "";

  useEffect(() => {
    const loadData = async () => {
      if (!studentId) return;
      setIsLoading(true);
      try {
        // Use current trimester or default to 1
        const currentTrimester = 1; 
        const [avg, stats, grades, courses, feesData] = await Promise.all([
          apiCalculateStudentAverage(studentId, currentTrimester),
          apiGetAttendanceStats(studentId),
          apiGetGradesByStudent(studentId),
          apiGetStudentCourses(studentId),
          apiGetMyFees()
        ]);
        
        setAverage(avg);
        setAttendanceStats(stats || { present: 0, absent: 0, late: 0, excused: 0 });
        setFees(feesData || []);
        
        // Grades usually come with populated subjects from backend
        // Sort by date to get recent ones
        const sortedGrades = (grades || []).sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setRecentGrades(sortedGrades.slice(0, 5));
        
        // Filter for upcoming courses
        const today = new Date().getDay();
        const sortedCourses = (courses || [])
          .filter(c => c.dayOfWeek >= today)
          .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
        
        setUpcomingCourses(sortedCourses.slice(0, 3));
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [studentId]);

  const totalAttendance = attendanceStats.present + attendanceStats.absent + attendanceStats.late + attendanceStats.excused;
  const attendanceRate = totalAttendance > 0 ? ((attendanceStats.present + attendanceStats.excused) / totalAttendance) * 100 : 100;

  const getMention = (avg: number) => {
    if (avg >= 18) return { label: "Excellent", color: "text-green-600" };
    if (avg >= 16) return { label: "Très Bien", color: "text-green-600" };
    if (avg >= 14) return { label: "Bien", color: "text-blue-600" };
    if (avg >= 12) return { label: "Assez Bien", color: "text-yellow-600" };
    if (avg >= 10) return { label: "Passable", color: "text-orange-600" };
    return { label: "Insuffisant", color: "text-destructive" };
  };

  const mention = getMention(average);
  const totalFeeBalance = fees.reduce((acc, f) => acc + f.balance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Bonjour, {user?.firstName} 👋
          </h1>
          <p className="text-muted-foreground">
            Voici un aperçu de vos performances scolaires.
          </p>
        </div>
        <div className="bg-card border rounded-lg px-4 py-2 text-sm font-medium shadow-sm">
          Année Scolaire: 2023-2024
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Moyenne Générale</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${mention.color}`}>{average.toFixed(2)}/20</div>
            <Progress value={(average / 20) * 100} className="mt-2" />
            <p className={`text-xs font-semibold mt-1 ${mention.color}`}>
              {mention.label}
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taux de Présence</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate.toFixed(1)}%</div>
            <Progress value={attendanceRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {attendanceStats.present} présences confirmées
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Absences & Retards</CardTitle>
            <Calendar className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceStats.absent}</div>
            <div className="flex gap-2 mt-2 text-xs">
              <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">{attendanceStats.late} retards</span>
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{attendanceStats.excused} justifiées</span>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Récompenses</CardTitle>
            <Award className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{average >= 14 ? "Tableau d'Honneur" : "-"}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Basé sur vos notes actuelles
            </p>
          </CardContent>
        </Card>

        <Card className={`overflow-hidden border-l-4 ${totalFeeBalance > 0 ? 'border-l-orange-500' : 'border-l-blue-500'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Solde Frais</CardTitle>
            <Wallet className={`h-4 w-4 ${totalFeeBalance > 0 ? 'text-orange-500' : 'text-blue-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalFeeBalance > 0 ? 'text-orange-500' : 'text-blue-600'}`}>
              {totalFeeBalance.toLocaleString()} $
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {totalFeeBalance > 0 ? "Paiement à régulariser" : "En règle avec l'école"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Grades & Schedule */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader className="pb-3 border-b mb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-primary" />
              Notes Récentes
            </CardTitle>
            <CardDescription>Vos 5 dernières évaluations enregistrées</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentGrades.length > 0 ? (
                recentGrades.map((grade, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {grade.subjectId?.name || "Matière"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Trimestre {grade.trimester} • {new Date(grade.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        (grade.moyenne || 0) >= 14 ? "text-green-600" : 
                        (grade.moyenne || 0) >= 10 ? "text-yellow-600" : "text-destructive"
                      }`}>
                        {(grade.moyenne)?.toFixed(1) || "0.0"}/20
                      </p>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        {grade.moyenne >= 10 ? "Validé" : "Échec"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Aucune note enregistrée pour le moment.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Prochains Cours
            </CardTitle>
            <CardDescription>Votre emploi du temps d'aujourd'hui</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingCourses.length > 0 ? (
                upcomingCourses.map((course, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-lg border border-border">
                    <div className="text-sm font-medium text-primary min-w-[100px]">
                      {course.startTime} - {course.endTime}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {course.subjectId?.name || "Matière"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {course.room} • {course.teacherId?.firstName} {course.teacherId?.lastName}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun cours prévu prochainement.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
