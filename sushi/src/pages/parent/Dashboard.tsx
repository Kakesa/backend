/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users, BookOpen, Calendar, Bell, TrendingUp, TrendingDown,
  FileText, Clock, CheckCircle, XCircle, AlertCircle, Download, Loader2,
  GraduationCap, Hash, Star, Target
} from "lucide-react";
import { useParentNotifications } from "@/hooks/useParentNotifications";
import { apiGetParentById } from "@/services/api/parents.api";
import { apiGetStudentById } from "@/services/api/students.api";
import { apiGetGradesByStudent, apiCalculateStudentAverage } from "@/services/api/grades.api";
import { apiGetAttendancesByStudent } from "@/services/api/attendance.api";
import { apiGetAssignmentsByStudent, apiGetStudentSubmission } from "@/services/api/assignments.api";
import { apiGetMyChildrenFees } from "@/services/api/fees.api";
import type { Student, Grade, Attendance, Assignment, AssignmentSubmission } from "@/types";
import { exportGrades, exportAttendance } from "@/lib/excelExport";
import { Wallet } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiInitiateMobilePayment, apiGetPaymentHistory, apiGetPaymentPlans } from "@/services/api/fees.api";
import { toast } from "sonner";
import PaymentHistory from "@/components/fees/PaymentHistory";
import PaymentPlan from "@/components/fees/PaymentPlan";
import FeeReminders from "@/components/fees/FeeReminders";
import ParentCompetences from "@/components/competences/ParentCompetences";

export default function ParentDashboard() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [parentError, setParentError] = useState<string | null>(null);

  // Data for selected child
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [weightedAverage, setWeightedAverage] = useState<number>(0);
  const [childrenFees, setChildrenFees] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [provider, setProvider] = useState<string>("M-PESA");
  const [isPaying, setIsPaying] = useState(false);
  const [activeFeeTab, setActiveFeeTab] = useState<"overview" | "history" | "plans" | "reminders">("overview");

  const { notifications, unreadCount } = useParentNotifications(user?.id || "");

  // Fetch children on mount
  useEffect(() => {
    const fetchChildren = async () => {
      if (!user?.linkedId && !user?.id) return;

      try {
        setLoadingChildren(true);
        setParentError(null);
        // Assuming user.linkedId is the parent ID
        const parentId = user?.linkedId || user?.id;
        if (!parentId) return;

        const parentData = await apiGetParentById(parentId);

        let studentsData: Student[] = [];
        if (parentData.childrenIds && parentData.childrenIds.length > 0) {
          const promises = parentData.childrenIds.map(id => apiGetStudentById(id));
          const results = await Promise.all(promises);
          studentsData = results.filter((s): s is Student => !!s);
        } else if (parentData.children && parentData.children.length > 0) {
          const promises = parentData.children.map(c => apiGetStudentById(c.id));
          const results = await Promise.all(promises);
          studentsData = results.filter((s): s is Student => !!s);
        }

        setChildren(studentsData);
        if (studentsData.length > 0) {
          setSelectedChildId(studentsData[0].id);
        }
      } catch (error: any) {
        console.error("Error fetching children:", error);
        const msg = error?.response?.data?.message || error?.message || "";
        if (error?.response?.status === 404 || msg.includes("introuvable")) {
          setParentError("Votre profil parent n'est pas encore lié à un enfant. Veuillez contacter l'administration pour associer votre compte.");
        } else {
          setParentError("Erreur lors du chargement des données. Veuillez réessayer.");
        }
      } finally {
        setLoadingChildren(false);
      }
    };
    fetchChildren();

    const fetchFees = async () => {
      try {
        const feesData = await apiGetMyChildrenFees();
        setChildrenFees(feesData);
      } catch (error) {
        console.error("Error fetching children fees:", error);
      }
    };
    fetchFees();
  }, [user]);

  // Fetch data when selected child changes
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedChildId) return;

      try {
        setLoadingData(true);
        // Current trimester (can be made dynamic later)
        const trimester = 1;
        const [gradesData, attendanceData, assignmentsData, avgData] = await Promise.all([
          apiGetGradesByStudent(selectedChildId),
          apiGetAttendancesByStudent(selectedChildId),
          apiGetAssignmentsByStudent(selectedChildId),
          apiCalculateStudentAverage(selectedChildId, trimester)
        ]);

        setGrades(gradesData);
        setAttendance(attendanceData);
        setAssignments(assignmentsData);
        setWeightedAverage(avgData);

        // Fetch submissions for assignments
        const submissionPromises = assignmentsData.map(a => apiGetStudentSubmission(a.id, selectedChildId));
        const submissionResults = await Promise.all(submissionPromises);
        setSubmissions(submissionResults.filter((s): s is AssignmentSubmission => !!s));

      } catch (error) {
        console.error("Error fetching child data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [selectedChildId]);

  const selectedChild = children.find(c => c.id === selectedChildId);
  const childClass = selectedChild?.class;
  const className = typeof childClass === 'object' ? childClass?.name : childClass;

  const getMention = (avg: number) => {
    if (avg >= 18) return { label: "Excellent", color: "text-green-600", badgeColor: "bg-green-600" };
    if (avg >= 16) return { label: "Très Bien", color: "text-green-600", badgeColor: "bg-green-600" };
    if (avg >= 14) return { label: "Bien", color: "text-blue-600", badgeColor: "bg-blue-600" };
    if (avg >= 12) return { label: "Assez Bien", color: "text-yellow-600", badgeColor: "bg-yellow-600" };
    if (avg >= 10) return { label: "Passable", color: "text-orange-600", badgeColor: "bg-orange-600" };
    return { label: "Insuffisant", color: "text-destructive", badgeColor: "bg-destructive" };
  };

  const mention = getMention(weightedAverage);

  const attendanceStats = useMemo(() => {
    const present = attendance.filter(a => a.status === "present").length;
    const absent = attendance.filter(a => a.status === "absent").length;
    const late = attendance.filter(a => a.status === "late").length;
    const total = attendance.length;
    const rate = total > 0 ? (present / total) * 100 : 100;
    return { present, absent, late, rate };
  }, [attendance]);

  const pendingAssignmentsCount = useMemo(() => {
    return assignments.filter(a =>
      !submissions.some(s => s.assignmentId === a.id) &&
      new Date(a.dueDate) >= new Date()
    ).length;
  }, [assignments, submissions]);

  const stats = [
    {
      label: "Moyenne générale",
      value: weightedAverage.toFixed(2),
      icon: BookOpen,
      color: "bg-primary",
      trend: weightedAverage >= 10,
      subValue: mention.label
    },
    { label: "Taux de présence", value: `${attendanceStats.rate.toFixed(0)}%`, icon: Calendar, color: "bg-secondary", trend: attendanceStats.rate >= 90 },
    { label: "Mes Enfants", value: children.length, icon: Users, color: "bg-green-500" },
    { label: "Devoirs en attente", value: pendingAssignmentsCount, icon: FileText, color: "bg-accent" },
  ];

  const currentChildFees = childrenFees.find(cf => cf.student.id === selectedChildId)?.fees || [];
  const currentChildBalance = currentChildFees.reduce((acc: number, f: any) => acc + (f.balance || 0), 0);

  stats.push({
    label: "Solde Frais",
    value: `${currentChildBalance.toLocaleString()} $`,
    icon: Wallet,
    color: currentChildBalance > 0 ? "bg-orange-500" : "bg-blue-500",
    subValue: currentChildBalance > 0 ? "À régulariser" : "En règle",
    trend: currentChildBalance <= 0
  });

  const gradesByTrimester = [1, 2, 3].map(trim => {
    const trimGrades = grades.filter(g => g.trimester === trim);
    // Note: We don't have weighted average per trimester here yet via simple aggregate, 
    // but the backend apiCalculateStudentAverage could be called per trimester if needed.
    // For now, simple avg for historical view
    const trimAvg = trimGrades.length > 0
      ? trimGrades.reduce((sum, g) => sum + (g.moyenne || 0), 0) / trimGrades.length
      : 0;
    return { trimester: trim, grades: trimGrades, average: trimAvg };
  });

  const handleExportGrades = () => {
    if (selectedChild) {
      exportGrades(grades, [selectedChild], []); // Subjects might be needed for proper naming if not in grades
    }
  };

  const handleExportAttendance = () => {
    if (selectedChild) {
      exportAttendance(attendance, [selectedChild]);
    }
  };

  const handleOpenPaymentModal = (fee: any) => {
    setSelectedFee(fee);
    setPaymentAmount(fee.balance.toString());
    setIsPaymentModalOpen(true);
  };

  const handleInitiatePayment = async () => {
    if (!selectedFee || !paymentAmount || !phoneNumber) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    try {
      setIsPaying(true);
      await apiInitiateMobilePayment({
        studentFeeId: selectedFee.id,
        amount: parseFloat(paymentAmount),
        phoneNumber: phoneNumber,
        provider: provider
      });

      toast.success("Demande de paiement envoyée ! Veuillez confirmer sur votre téléphone.");
      setIsPaymentModalOpen(false);
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Erreur lors de l'initiation du paiement");
    } finally {
      setIsPaying(false);
    }
  };

  if (loadingChildren && children.length === 0 && !parentError) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (parentError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <div className="p-4 rounded-full bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-lg font-medium">Profil parent non trouvé</p>
            <p className="text-sm text-muted-foreground">{parentError}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bienvenue, {user?.firstName}</h1>
          <p className="text-muted-foreground">
            Suivi scolaire de vos enfants
          </p>
        </div>

        {children.length > 1 && (
          <Select value={selectedChildId} onValueChange={setSelectedChildId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sélectionner un enfant" />
            </SelectTrigger>
            <SelectContent>
              {children.map(child => (
                <SelectItem key={child.id} value={child.id}>
                  {child.firstName} {child.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {selectedChild && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
              {selectedChild.firstName[0]}{selectedChild.lastName[0]}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{selectedChild.firstName} {selectedChild.lastName}</h2>
              <p className="text-muted-foreground">{className || "Classe inconnue"} - {selectedChild.matricule || ""}</p>
            </div>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportGrades}>
                <Download className="h-4 w-4 mr-2" />
                Notes
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportAttendance}>
                <Download className="h-4 w-4 mr-2" />
                Présences
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loadingData ? (
        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  <div className={`rounded-lg p-2 ${stat.color}`}>
                    <stat.icon className="h-4 w-4 text-primary-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <p className={`text-2xl font-bold ${index === 0 ? mention.color : ""}`}>{stat.value}</p>
                    {stat.trend !== undefined && (
                      stat.trend
                        ? <TrendingUp className={`h-4 w-4 ${index === 0 ? mention.color : "text-green-500"}`} />
                        : <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  {stat.subValue && (
                    <p className={`text-xs font-semibold mt-1 ${mention.color}`}>
                      {stat.subValue}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="children" className="space-y-4">
            <TabsList>
              <TabsTrigger value="children">
                <Users className="h-4 w-4 mr-1" />
                Mes Enfants ({children.length})
              </TabsTrigger>
              <TabsTrigger value="grades">Notes</TabsTrigger>
              <TabsTrigger value="attendance">Présences</TabsTrigger>
              <TabsTrigger value="assignments">Devoirs</TabsTrigger>
              <TabsTrigger value="competences">
                <Target className="h-4 w-4 mr-1" />
                Compétences
              </TabsTrigger>
              <TabsTrigger value="fees">Frais</TabsTrigger>
              <TabsTrigger value="notifications">
                Notifications
                {unreadCount > 0 && (
                  <Badge className="ml-2 h-5 min-w-5 px-1 flex items-center justify-center text-xs bg-red-500">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ===== ONGLET MES ENFANTS ===== */}
            <TabsContent value="children" className="space-y-4">
              {children.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-3">
                    <div className="p-4 rounded-full bg-muted">
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-medium">Aucun enfant associé</p>
                    <p className="text-sm text-muted-foreground">
                      Contactez l'administration pour lier vos enfants à votre compte.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {children.map((child) => {
                    const childClassRaw = child.class;
                    const childClassName = typeof childClassRaw === 'object'
                      ? (childClassRaw as any)?.name
                      : childClassRaw;
                    const childSection = typeof childClassRaw === 'object'
                      ? (childClassRaw as any)?.section
                      : (child as any).section;
                    const childAcademicYear = typeof childClassRaw === 'object'
                      ? (childClassRaw as any)?.academicYear
                      : (child as any).academicYear;

                    // Avatar color based on first letter
                    const palette = [
                      "bg-blue-500", "bg-purple-500", "bg-emerald-500",
                      "bg-orange-500", "bg-pink-500", "bg-teal-500"
                    ];
                    const avatarColor = palette[(child.firstName?.charCodeAt(0) || 0) % palette.length];

                    const isSelected = child.id === selectedChildId;

                    return (
                      <Card
                        key={child.id}
                        className={`cursor-pointer hover:shadow-lg transition-all border-2 ${isSelected
                          ? "border-primary shadow-md"
                          : "border-border hover:border-primary/40"
                          }`}
                        onClick={() => setSelectedChildId(child.id)}
                      >
                        <CardContent className="p-5">
                          {/* Avatar + nom */}
                          <div className="flex items-center gap-4 mb-4">
                            <div className={`flex h-16 w-16 items-center justify-center rounded-full ${avatarColor} text-white text-2xl font-bold shrink-0 shadow-md`}>
                              {child.firstName?.[0]?.toUpperCase()}{child.lastName?.[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold truncate">
                                {child.firstName} {child.lastName}
                              </h3>
                              {isSelected && (
                                <Badge className="mt-1 bg-primary/10 text-primary border border-primary/20 text-xs">
                                  Sélectionné ✓
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Infos scolaires */}
                          <div className="space-y-2 text-sm">
                            {childClassName && (
                              <div className="flex items-center gap-2">
                                <GraduationCap className="h-4 w-4 shrink-0 text-primary" />
                                <span className="font-semibold text-foreground">{childClassName}</span>
                                {childSection && (
                                  <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
                                    {childSection}
                                  </span>
                                )}
                              </div>
                            )}
                            {childAcademicYear && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                                <span>
                                  Année scolaire :{" "}
                                  <span className="font-semibold text-foreground">{childAcademicYear}</span>
                                </span>
                              </div>
                            )}
                            {child.matricule && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Hash className="h-4 w-4 shrink-0 text-primary" />
                                <span>
                                  Matricule :{" "}
                                  <span className="font-mono font-semibold text-foreground">
                                    {child.matricule}
                                  </span>
                                </span>
                              </div>
                            )}
                            {(child as any).dateOfBirth && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4 shrink-0 text-primary" />
                                <span>
                                  {new Date((child as any).dateOfBirth).toLocaleDateString('fr-FR', {
                                    day: '2-digit', month: 'long', year: 'numeric'
                                  })}
                                </span>
                              </div>
                            )}
                            {(child as any).genre && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Users className="h-4 w-4 shrink-0 text-primary" />
                                <span>{(child as any).genre}</span>
                              </div>
                            )}
                          </div>

                          {/* Stats rapides si sélectionné */}
                          {isSelected ? (
                            <>
                              <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-2 text-center">
                                <div>
                                  <p className={`text-xl font-bold ${mention.color}`}>
                                    {weightedAverage.toFixed(1)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">Moy./20</p>
                                </div>
                                <div>
                                  <p className={`text-xl font-bold ${attendanceStats.rate >= 90 ? "text-green-600" :
                                    attendanceStats.rate >= 75 ? "text-yellow-600" : "text-red-600"
                                    }`}>
                                    {attendanceStats.rate.toFixed(0)}%
                                  </p>
                                  <p className="text-xs text-muted-foreground">Présence</p>
                                </div>
                                <div>
                                  <p className={`text-xl font-bold ${pendingAssignmentsCount === 0 ? "text-green-600" :
                                    pendingAssignmentsCount <= 2 ? "text-yellow-600" : "text-red-600"
                                    }`}>
                                    {pendingAssignmentsCount}
                                  </p>
                                  <p className="text-xs text-muted-foreground">Devoirs</p>
                                </div>
                              </div>
                              <div className="mt-2 text-center">
                                <Badge className={mention.badgeColor}>
                                  {mention.label}
                                </Badge>
                              </div>
                            </>
                          ) : (
                            <p className="mt-4 pt-3 border-t text-xs text-center text-muted-foreground italic">
                              Cliquer pour voir les détails
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="grades" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-3">
                {gradesByTrimester.map(({ trimester, grades: trimGrades, average }) => (
                  <Card key={trimester}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Trimestre {trimester}
                        <Badge variant={average >= 12 ? "default" : average >= 10 ? "secondary" : "destructive"}>
                          {average.toFixed(2)}/20
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {trimGrades.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Pas de notes</p>
                      ) : (
                        trimGrades.map(grade => {
                          // Resolve subject name
                          const subjectName = typeof grade.subjectId === 'object' ? (grade.subjectId as any).name : 'Matière';
                          return (
                            <div key={grade.id} className="flex items-center justify-between p-2 bg-muted rounded">
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold">{subjectName}</span>
                                <span className="text-[10px] text-muted-foreground">Coef: {typeof grade.subjectId === 'object' ? (grade.subjectId as any).coefficient : '-'}</span>
                              </div>
                              <div className="text-right">
                                <span className={`font-bold block ${(grade.moyenne || 0) >= 14 ? "text-green-600" :
                                  (grade.moyenne || 0) >= 10 ? "text-yellow-600" : "text-red-600"
                                  }`}>
                                  {grade.moyenne?.toFixed(1)}/20
                                </span>
                                {grade.appreciation && (
                                  <span className="text-[10px] text-muted-foreground italic leading-none">{grade.appreciation}</span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Présences */}
            <TabsContent value="attendance" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold">{attendanceStats.present}</p>
                        <p className="text-sm text-muted-foreground">Présences</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <XCircle className="h-8 w-8 text-red-500" />
                      <div>
                        <p className="text-2xl font-bold">{attendanceStats.absent}</p>
                        <p className="text-sm text-muted-foreground">Absences</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Clock className="h-8 w-8 text-yellow-500" />
                      <div>
                        <p className="text-2xl font-bold">{attendanceStats.late}</p>
                        <p className="text-sm text-muted-foreground">Retards</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-2xl font-bold">{attendanceStats.rate.toFixed(0)}%</p>
                        <p className="text-sm text-muted-foreground">Taux global</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              {/* List */}
              <Card>
                <CardHeader>
                  <CardTitle>Historique des présences</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {attendance.slice(0, 10).map((att, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          {att.status === "present" && <CheckCircle className="h-5 w-5 text-green-500" />}
                          {att.status === "absent" && <XCircle className="h-5 w-5 text-red-500" />}
                          {att.status === "late" && <Clock className="h-5 w-5 text-yellow-500" />}
                          {att.status === "excused" && <AlertCircle className="h-5 w-5 text-blue-500" />}
                          <span className="font-medium">{new Date(att.date).toLocaleDateString()}</span>
                        </div>
                        <Badge variant={
                          att.status === "present" ? "default" :
                            att.status === "absent" ? "destructive" :
                              att.status === "late" ? "secondary" : "outline"
                        }>
                          {att.status === "present" ? "Présent" :
                            att.status === "absent" ? "Absent" :
                              att.status === "late" ? "En retard" : "Excusé"}
                        </Badge>
                      </div>
                    ))}
                    {attendance.length === 0 && <p className="text-center text-muted-foreground">Aucune présence enregistrée.</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Devoirs */}
            <TabsContent value="assignments" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Devoirs à rendre</CardTitle>
                    <CardDescription>Devoirs en attente de soumission</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {assignments
                      .filter(a => !submissions.some(s => s.assignmentId === a.id))
                      .map(assignment => {
                        const isOverdue = new Date(assignment.dueDate) < new Date();
                        const subjectName = typeof assignment.courseId === 'object' ? (assignment.courseId as any).name : 'Cours'; // Actually course name
                        return (
                          <div key={assignment.id} className={`p-3 rounded-lg border ${isOverdue ? 'border-red-300 bg-red-50' : 'border-border'}`}>
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{assignment.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {subjectName}
                                </p>
                              </div>
                              <Badge variant={isOverdue ? "destructive" : "outline"}>
                                {isOverdue ? "En retard" : new Date(assignment.dueDate).toLocaleDateString('fr-FR')}
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                    {assignments.filter(a => !submissions.some(s => s.assignmentId === a.id)).length === 0 && (
                      <p className="text-center text-muted-foreground py-4">Aucun devoir en attente</p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Devoirs rendus</CardTitle>
                    <CardDescription>Devoirs soumis et notés</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {submissions.map(submission => {
                      const assignment = assignments.find(a => a.id === submission.assignmentId);
                      return (
                        <div key={submission.id} className="p-3 rounded-lg border">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{assignment?.title || 'Devoir'}</p>
                              <p className="text-sm text-muted-foreground">
                                Rendu le {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString('fr-FR') : '-'}
                              </p>
                            </div>
                            {submission.grade !== undefined ? (
                              <Badge variant={submission.grade >= 10 ? "default" : "destructive"}>
                                {submission.grade}/{assignment?.maxPoints || 20}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">En correction</Badge>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Compétences */}
            <TabsContent value="competences" className="space-y-4">
              {selectedChild ? (
                <ParentCompetences 
                  studentId={selectedChildId}
                  studentName={`${selectedChild.firstName} ${selectedChild.lastName}`}
                />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-3">
                    <div className="p-4 rounded-full bg-muted">
                      <Target className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-medium">Aucun enfant sélectionné</p>
                    <p className="text-sm text-muted-foreground">
                      Veuillez sélectionner un enfant pour voir ses compétences
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Frais */}
            <TabsContent value="fees" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                {[
                  { id: "overview", label: "Aperçu", icon: Wallet },
                  { id: "history", label: "Historique", icon: Calendar },
                  { id: "plans", label: "Plans", icon: Calendar },
                  { id: "reminders", label: "Rappels", icon: Bell }
                ].map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeFeeTab === tab.id ? "default" : "outline"}
                    onClick={() => setActiveFeeTab(tab.id as any)}
                    className="flex items-center gap-2"
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </Button>
                ))}
              </div>

              {activeFeeTab === "overview" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-primary" />
                      État des frais - {selectedChild?.firstName}
                    </CardTitle>
                    <CardDescription>
                      Détail des frais scolaires et statut des paiements.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {currentChildFees.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground italic">
                        Aucun frais enregistré pour cet élève.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                          <div className="p-4 bg-muted/50 rounded-lg border text-center">
                            <p className="text-sm text-muted-foreground">Total Attribué</p>
                            <p className="text-xl font-bold">
                              {currentChildFees.reduce((acc: number, f: any) => acc + f.totalAmount, 0).toLocaleString()} $
                            </p>
                          </div>
                          <div className="p-4 bg-green-50 rounded-lg border border-green-100 text-center">
                            <p className="text-sm text-green-700">Total Payé</p>
                            <p className="text-xl font-bold text-green-700">
                              {currentChildFees.reduce((acc: number, f: any) => acc + f.amountPaid, 0).toLocaleString()} $
                            </p>
                          </div>
                          <div className={`p-4 rounded-lg border text-center ${currentChildBalance > 0 ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'}`}>
                            <p className={`text-sm ${currentChildBalance > 0 ? 'text-orange-700' : 'text-blue-700'}`}>Reste à Payer</p>
                            <p className={`text-xl font-bold ${currentChildBalance > 0 ? 'text-orange-700' : 'text-blue-700'}`}>
                              {currentChildBalance.toLocaleString()} $
                            </p>
                          </div>
                        </div>

                        <div className="rounded-md border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead>Libellé</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Payé</TableHead>
                                <TableHead>Solde</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {currentChildFees.map((fee: any) => (
                                <TableRow key={fee.id}>
                                  <TableCell className="font-medium">{fee.feeDefinitionId?.name}</TableCell>
                                  <TableCell>{fee.totalAmount} $</TableCell>
                                  <TableCell className="text-green-600">+{fee.amountPaid} $</TableCell>
                                  <TableCell className="font-bold">{fee.balance} $</TableCell>
                                  <TableCell>
                                    <Badge variant={
                                      fee.status === "PAID" ? "default" :
                                        fee.status === "PARTIAL" ? "secondary" : "destructive"
                                    }>
                                      {fee.status === "PAID" ? "En règle" :
                                        fee.status === "PARTIAL" ? "Partiel" : "Non payé"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {fee.balance > 0 && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                                        onClick={() => handleOpenPaymentModal(fee)}
                                      >
                                        Payer
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20 flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-semibold text-primary">Information Paiement</p>
                            <p className="text-muted-foreground italic">Veuillez vous présenter à la caisse de l'école pour régulariser les paiements. N'oubliez pas de mentionner le matricule de l'élève lors des virements.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeFeeTab === "history" && (
                <PaymentHistory 
                  studentId={selectedChildId}
                />
              )}

              {activeFeeTab === "plans" && (
                <PaymentPlan 
                  studentId={selectedChildId}
                  totalAmount={currentChildFees.reduce((acc: number, f: any) => acc + f.totalAmount, 0)}
                  balance={currentChildBalance}
                />
              )}

              {activeFeeTab === "reminders" && (
                <FeeReminders 
                  studentFees={currentChildFees}
                  onReminderSent={() => {
                    // Refresh fees data
                    const fetchFees = async () => {
                      try {
                        const feesData = await apiGetMyChildrenFees();
                        setChildrenFees(feesData);
                      } catch (error) {
                        console.error("Error refreshing fees:", error);
                      }
                    };
                    fetchFees();
                  }}
                />
              )}
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Messages et alertes de l'école</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {notifications.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">Aucune notification</p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 rounded-lg ${notif.read ? "bg-muted" : "bg-primary/10 border-l-4 border-primary"}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            <p className={`font-medium ${!notif.read ? "text-primary" : ""}`}>
                              Note de {notif.studentName}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">{notif.createdAt.toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Nouvelle note de <span className="font-bold">{notif.grade}/20</span> en {notif.subjectName}.
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Paiement Mobile Money</DialogTitle>
            <DialogDescription>
              Payez vos frais scolaires instantanément via M-Pesa, Orange Money ou Airtel Money.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fee-name">Frais</Label>
              <Input id="fee-name" value={selectedFee?.feeDefinitionId?.name || ""} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Montant à payer ($)</Label>
              <Input
                id="amount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-[10px] text-muted-foreground italic">Solde restant : {selectedFee?.balance} $</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="provider">Opérateur</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Choisir un opérateur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M-PESA">M-Pesa</SelectItem>
                  <SelectItem value="ORANGE">Orange Money</SelectItem>
                  <SelectItem value="AIRTEL">Airtel Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+243XXXXXXXXX"
              />
              <p className="text-[10px] text-muted-foreground">Format international requis (ex: +243...)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>Annuler</Button>
            <Button onClick={handleInitiatePayment} disabled={isPaying}>
              {isPaying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traitement...
                </>
              ) : (
                "Confirmer le paiement"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
