/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  FileText,
  Upload,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  BookOpen,
  Send,
  Paperclip,
  Link as LinkIcon,
  X,
  Loader2,
  User,
  Star,
  GraduationCap,
  TrendingUp
} from "lucide-react";

import { cn } from "@/lib/utils";
import { AssignmentDetailView } from "@/components/assignments/AssignmentDetailView";

import {
  apiGetAssignmentsByStudent,
  apiSubmitAssignment,
  apiUploadAssignmentFile,
  apiGetStudentSubmission,
  apiGetAssignmentById
} from "@/services/api/assignments.api";
import type { Assignment, AssignmentSubmission } from "@/types/assignment.types";

type SubmissionType = "file" | "link";

export default function StudentAssignments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, AssignmentSubmission>>({});

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [selectedFullAssignment, setSelectedFullAssignment] = useState<Assignment | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);


  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssignments = React.useCallback(async () => {
    if (!user?.linkedId) return;
    try {
      setLoading(true);
      const data = await apiGetAssignmentsByStudent(user.linkedId);
      setAssignments(data);

      const subs: Record<string, AssignmentSubmission> = {};
      await Promise.all(data.map(async (a) => {
        try {
          const sub = await apiGetStudentSubmission(a.id, user.linkedId!);
          if (sub) subs[a.id] = sub;
        } catch (e) {
          // No submission found, ignore
        }
      }));
      setSubmissions(subs);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les devoirs.",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleSubmission = async (data: {
    content: string;
    type: "file" | "link";
    file?: File;
    link?: string;
    answers?: { questionId: string; value: string }[];
    selfReview?: { rubricId: string; score: number }[];
  }) => {
    if (!selectedAssignmentId || !user?.linkedId) return;

    try {
      setSubmitting(true);
      const attachments: string[] = [];

      if (data.type === "file" && data.file) {
        const url = await apiUploadAssignmentFile(selectedAssignmentId, data.file);
        if (url) attachments.push(url);
      }

      const submission = await apiSubmitAssignment(selectedAssignmentId, user.linkedId, {
        content: data.content,
        submissionType: data.type,
        attachments: data.type === "file" ? attachments : undefined,
        linkUrl: data.type === "link" ? data.link : undefined,
        answers: data.answers,
        selfReview: data.selfReview
      });

      setSubmissions(prev => ({ ...prev, [selectedAssignmentId]: submission }));
      toast({ title: "Succès", description: "Votre travail a été transmis avec succès." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Une erreur est survenue lors de la soumission." });
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch full assignment details when selecting
  const handleSelectAssignment = async (id: string) => {
    setSelectedAssignmentId(id);
    setLoadingDetail(true);
    try {
      const full = await apiGetAssignmentById(id);
      setSelectedFullAssignment(full);
    } catch (error) {
      console.error("Error fetching full assignment:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les questions du devoir. Veuillez réessayer.",
      });
      setSelectedAssignmentId(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  if (selectedAssignmentId && (loadingDetail || selectedFullAssignment)) {
    if (loadingDetail) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
      <AssignmentDetailView
        assignment={selectedFullAssignment!}
        submission={submissions[selectedAssignmentId]}
        mode="student"
        onBack={() => { setSelectedAssignmentId(null); setSelectedFullAssignment(null); }}
        onSubmit={handleSubmission}
        isSubmitting={submitting}
      />
    );
  }

  const pendingAssignments = assignments.filter(a => !submissions[a.id] && new Date(a.dueDate) >= new Date());
  const submittedAssignmentsList = assignments.filter(a => !!submissions[a.id]);
  const overdueAssignments = assignments.filter(a => !submissions[a.id] && new Date(a.dueDate) < new Date());

  // Helper to check if assignment is fully auto-correctable
  const isFullyAutoCorrectable = (a: Assignment): boolean => {
    if (!a.questions || a.questions.length === 0) return false;
    return a.questions.every(q => q.type === 'qcm' || (q.type === 'short_answer' && q.correctAnswer));
  };

  // Helper to calculate auto-score
  const calculateAutoScore = (a: Assignment, s: AssignmentSubmission): number => {
    if (!a.questions) return 0;
    let score = 0;
    const answers = s.answers || [];
    const answersMap = Object.fromEntries(answers.map(ans => [ans.questionId, ans.value]));

    a.questions.forEach(q => {
      if (q.type === 'qcm' && q.options) {
        const studentAns = answersMap[q.id];
        const correctOpt = q.options.find(o => o.isCorrect);
        if (studentAns === correctOpt?.id) score += q.points;
      } else if (q.type === 'short_answer' && q.correctAnswer) {
        const studentAns = answersMap[q.id]?.trim().toLowerCase();
        if (studentAns === q.correctAnswer.trim().toLowerCase()) score += q.points;
      }
    });
    return score;
  };

  const gradedAssignments = submittedAssignmentsList.filter(a => {
    const sub = submissions[a.id];
    return sub?.status === 'graded' || isFullyAutoCorrectable(a);
  });

  const avgGrade = gradedAssignments.length > 0
    ? gradedAssignments.reduce((acc, a) => {
      const sub = submissions[a.id];
      let score = 0;
      if (sub.status === 'graded' && sub.grade !== undefined) {
        score = sub.grade;
      } else if (isFullyAutoCorrectable(a)) {
        score = calculateAutoScore(a, sub);
      }
      const max = a.maxPoints || 20;
      return acc + (score / max) * 20;
    }, 0) / gradedAssignments.length
    : null;

  const getSubjectName = (assignment: Assignment): string => {
    const cId = assignment.courseId as any;
    if (!cId) return "Matière";
    if (typeof cId === "object") {
      if (cId.subjectId?.name) return cId.subjectId.name;
      if (cId.name) return cId.name;
    }
    return "Matière";
  };

  const getStatusBadge = (assignment: Assignment) => {
    const submission = submissions[assignment.id];
    const dueDate = new Date(assignment.dueDate);
    const now = new Date();
    const isOverdue = dueDate < now && !submission;

    if (submission) {
      if (submission.status === 'graded') {
        return <Badge className="bg-green-500 text-white"><CheckCircle2 className="h-3 w-3 mr-1" />Noté: {submission.grade}/{assignment.maxPoints}</Badge>;
      }
      if (isFullyAutoCorrectable(assignment)) {
        const autoScore = calculateAutoScore(assignment, submission);
        return <Badge className="bg-green-500 text-white"><CheckCircle2 className="h-3 w-3 mr-1" />Auto: {autoScore}/{assignment.maxPoints}</Badge>;
      }
      return <Badge className="bg-blue-100 text-blue-600 border-none"><CheckCircle2 className="h-3 w-3 mr-1" />Soumis</Badge>;
    }
    if (isOverdue) {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />En retard</Badge>;
    }
    return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />À rendre</Badge>;
  };

  const renderAssignmentCard = (assignment: Assignment) => {
    const subjectName = getSubjectName(assignment);

    return (
      <Card
        key={assignment.id}
        className="hover:shadow-lg transition-all border-none shadow-sm cursor-pointer active:scale-[0.98]"
        onClick={() => handleSelectAssignment(assignment.id)}
      >
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{subjectName}</span>
                {getStatusBadge(assignment)}
              </div>
              <h3 className="font-bold text-foreground truncate">{assignment.title}</h3>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(assignment.dueDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                </span>
                <span className="font-medium text-primary">{assignment.maxPoints} pts</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Mes Travaux</h1>
          <p className="text-muted-foreground text-lg">Consultez vos devoirs et transmettez vos rendus</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Moyenne TP</p>
            <p className="text-2xl font-black text-primary">{avgGrade !== null ? `${avgGrade.toFixed(1)}/20` : "-"}</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "À rendre", value: pendingAssignments.length, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Soumis", value: submittedAssignmentsList.length, color: "text-green-600", bg: "bg-green-50" },
          { label: "En retard", value: overdueAssignments.length, color: "text-red-600", bg: "bg-red-50" }
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className={cn("text-3xl font-black", stat.color)}>{stat.value}</p>
              </div>
              <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", stat.bg)}>
                {i === 0 ? <Clock className={stat.color} /> : i === 1 ? <CheckCircle2 className={stat.color} /> : <AlertTriangle className={stat.color} />}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-xl h-auto">
          <TabsTrigger value="pending" className="rounded-lg py-2 px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">À rendre</TabsTrigger>
          <TabsTrigger value="submitted" className="rounded-lg py-2 px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">Soumis</TabsTrigger>
          <TabsTrigger value="overdue" className="rounded-lg py-2 px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">Retard</TabsTrigger>
          <TabsTrigger value="grades" className="rounded-lg py-2 px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">Évaluations</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingAssignments.length === 0 ? <div className="col-span-full py-12 text-center text-muted-foreground">Aucun devoir à rendre pour le moment.</div> : pendingAssignments.map(renderAssignmentCard)}
          </div>
        </TabsContent>

        <TabsContent value="submitted" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {submittedAssignmentsList.length === 0 ? <div className="col-span-full py-12 text-center text-muted-foreground">Aucun devoir soumis.</div> : submittedAssignmentsList.map(renderAssignmentCard)}
          </div>
        </TabsContent>

        <TabsContent value="overdue" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overdueAssignments.length === 0 ? <div className="col-span-full py-12 text-center text-muted-foreground">Félicitations, vous n'avez aucun retard !</div> : overdueAssignments.map(renderAssignmentCard)}
          </div>
        </TabsContent>

        <TabsContent value="grades" className="mt-6 space-y-4">
          {gradedAssignments.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">Aucune évaluation disponible.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {gradedAssignments.map((assignment) => {
                const submission = submissions[assignment.id];
                let grade = 0;
                let isAutoCorrected = false;

                if (submission?.status === 'graded' && submission.grade !== undefined) {
                  grade = submission.grade;
                } else if (isFullyAutoCorrectable(assignment)) {
                  grade = calculateAutoScore(assignment, submission);
                  isAutoCorrected = true;
                }

                const max = assignment.maxPoints || 20;
                const normalized = (grade / max) * 20;
                const subjectName = getSubjectName(assignment);

                return (
                  <Card key={assignment.id} className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => handleSelectAssignment(assignment.id)}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{subjectName}</Badge>
                            <Badge variant="secondary" className="bg-muted text-muted-foreground">{assignment.type}</Badge>
                            {isAutoCorrected && <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Auto-corrigé</Badge>}
                          </div>
                          <h3 className="text-xl font-bold">{assignment.title}</h3>
                          {submission.feedback && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-1 italic">"{submission.feedback}"</p>
                          )}
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-1">Résultat</p>
                            <div className="flex items-baseline gap-1">
                              <span className={cn("text-3xl font-black", normalized >= 10 ? "text-green-600" : "text-destructive")}>{grade}</span>
                              <span className="text-muted-foreground font-medium">/{max}</span>
                            </div>
                          </div>
                          <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center font-black text-xl", normalized >= 14 ? "bg-green-50 text-green-600" : normalized >= 10 ? "bg-yellow-50 text-yellow-600" : "bg-red-50 text-red-600")}>
                            {normalized.toFixed(0)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

