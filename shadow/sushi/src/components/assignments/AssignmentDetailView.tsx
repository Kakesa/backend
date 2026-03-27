/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  ArrowLeft,
  GraduationCap,
  MessageSquare,
  Star,
  Sparkles,
  Printer,
  Download
} from "lucide-react";
import type { Assignment, AssignmentSubmission, Question } from "@/types/assignment.types";
import { cn } from "@/lib/utils";

interface AssignmentDetailViewProps {
  assignment: Assignment;
  submission?: AssignmentSubmission;
  mode: "student" | "teacher";
  onBack: () => void;
  onSubmit?: (data: {
    content: string;
    type: "file" | "link";
    file?: File;
    link?: string;
    answers?: { questionId: string; value: string }[];
    selfReview?: { rubricId: string; score: number }[];
  }) => Promise<void>;
  onGrade?: (data: { grade: number; feedback: string }) => Promise<void>;
  isSubmitting?: boolean;
}

export function AssignmentDetailView({
  assignment,
  submission,
  mode,
  onBack,
  onSubmit,
  onGrade,
  isSubmitting = false,
}: AssignmentDetailViewProps) {
  // Student Submission State
  const [content, setContent] = useState("");
  const [type, setType] = useState<"file" | "link">("file");
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Teacher Grading State
  const [grade, setGrade] = useState<number>(submission?.grade || 0);
  const [feedback, setFeedback] = useState(submission?.feedback || "");

  // Structured Answers state
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    if (submission?.answers) {
      const initial: Record<string, string> = {};
      submission.answers.forEach(a => {
        initial[a.questionId] = a.value;
      });
      return initial;
    }
    return {};
  });

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const [selfReview, setSelfReview] = useState<Record<string, number>>(() => {
    if (submission?.selfReview) {
      const initial: Record<string, number> = {};
      submission.selfReview.forEach(r => {
        initial[r.rubricId] = r.score;
      });
      return initial;
    }
    return {};
  });

  const handleSelfReviewChange = (rubricId: string, score: number) => {
    setSelfReview(prev => ({ ...prev, [rubricId]: score }));
  };

  const dueDate = new Date(assignment.dueDate);
  const isOverdue = dueDate < new Date() && !submission;
  const hasQuestions = !!(assignment.questions && assignment.questions.length > 0);

  // Submission is valid if: questions answered OR file/link provided (or both)
  const answeredCount = Object.keys(answers).filter(k => answers[k]?.trim()).length;
  const totalQuestions = assignment.questions?.length || 0;
  const hasAnsweredAllQuestions = hasQuestions && answeredCount >= totalQuestions;
  const hasFileOrLink = type === "file" ? !!file : !!link;
  const isSubmitDisabled = isSubmitting ||
    (hasQuestions && !hasAnsweredAllQuestions) ||
    (!hasQuestions && !hasFileOrLink);

  // Auto-correction QCM: calculate score from correct answers
  const calculateAutoScore = (currentAnswers?: Record<string, string>): { autoGrade: number; totalPoints: number; details: { questionId: string; correct: boolean; points: number }[] } => {
    if (!assignment.questions) return { autoGrade: 0, totalPoints: 0, details: [] };

    const details: { questionId: string; correct: boolean; points: number }[] = [];
    let autoGrade = 0;
    let totalPoints = 0;

    const sourceAnswers = currentAnswers || (submission?.answers ? Object.fromEntries(submission.answers.map(a => [a.questionId, a.value])) : answers);

    assignment.questions.forEach(q => {
      totalPoints += q.points;
      if (q.type === 'qcm' && q.options) {
        const studentAnswer = sourceAnswers[q.id];
        const correctOption = q.options.find(o => o.isCorrect);
        const isCorrect = studentAnswer === correctOption?.id;
        if (isCorrect) autoGrade += q.points;
        details.push({ questionId: q.id, correct: isCorrect, points: isCorrect ? q.points : 0 });
      } else if (q.type === 'short_answer' && q.correctAnswer) {
        const studentAnswer = sourceAnswers[q.id]?.trim().toLowerCase();
        const isCorrect = studentAnswer === q.correctAnswer.trim().toLowerCase();
        if (isCorrect) autoGrade += q.points;
        details.push({ questionId: q.id, correct: isCorrect, points: isCorrect ? q.points : 0 });
      } else {
        // long_answer — manual grading needed
        details.push({ questionId: q.id, correct: false, points: 0 });
      }
    });

    return { autoGrade, totalPoints, details };
  };

  const isFullyAutoCorrectable = (): boolean => {
    if (!assignment.questions || assignment.questions.length === 0) return false;
    return assignment.questions.every(q => q.type === 'qcm' || (q.type === 'short_answer' && q.correctAnswer));
  };

  const qcmResults = (mode === 'teacher' || (mode === 'student' && submission)) && submission ? calculateAutoScore() : null;
  const hasAutoCorrectableQuestions = assignment.questions?.some(q => q.type === 'qcm' || (q.type === 'short_answer' && q.correctAnswer));
  const studentAutoScore = mode === 'student' && submission && isFullyAutoCorrectable() ? calculateAutoScore() : null;

  const getSubjectName = () => {
    const cId = assignment.courseId as any;
    if (!cId) return "Matière";
    return typeof cId === "object" ? (cId.subjectId?.name || cId.name) : "Matière";
  };

  const getTeacherName = () => {
    const tId = assignment.teacherId as any;
    if (!tId) return "Enseignant";
    return typeof tId === "object" ? `${tId.firstName} ${tId.lastName}` : "Enseignant";
  };

  const handleSubmit = async () => {
    if (onSubmit) {
      const formattedAnswers = Object.entries(answers).map(([id, val]) => ({ questionId: id, value: val }));
      const formattedSelfReview = Object.entries(selfReview).map(([id, val]) => ({ rubricId: id, score: val }));

      await onSubmit({
        content,
        type,
        file: file || undefined,
        link,
        answers: formattedAnswers,
        selfReview: formattedSelfReview
      });
    }
  };

  const handleGrade = async () => {
    if (onGrade) {
      await onGrade({ grade, feedback });
    }
  };

  // --- Header components ---
  const ClassicHeader = () => (
    <CardHeader className="bg-primary/5 pb-8">
      <div className="flex items-center gap-2 text-primary mb-2">
        <BookOpen className="h-4 w-4" />
        <span className="text-sm font-medium uppercase tracking-wider">{getSubjectName()}</span>
      </div>
      <CardTitle className="text-3xl font-bold">{assignment.title}</CardTitle>
      <div className="flex items-center gap-6 mt-4 text-muted-foreground">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="text-sm">{getTeacherName()}</span>
        </div>
        <div className="flex items-center gap-2 text-red-500">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">
            Limite: {dueDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>
    </CardHeader>
  );

  const WorksheetHeader = () => (
    <div className="border-b-2 border-primary/20 pb-6 mb-8 print:border-slate-300">
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-primary print:text-slate-900">{assignment.title}</h2>
          <p className="text-sm font-bold text-muted-foreground uppercase print:text-slate-600">{getSubjectName()}</p>
        </div>
        <div className="text-right space-y-1">
          <Badge variant="outline" className="border-primary/20 text-primary uppercase font-bold px-4 py-1 print:border-slate-300 print:text-slate-800">
            Année Scolaire 2023-2024
          </Badge>
          <p className="text-xs text-muted-foreground font-medium italic"> Scholar Buddy Link </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 pt-4">
        <div className="border-b border-dashed border-muted-foreground pb-1 print:border-slate-400">
          <span className="text-xs font-bold uppercase text-muted-foreground mr-2 print:text-slate-700">Nom de l'élève :</span>
          <span className="text-sm font-semibold">{submission ? (typeof submission.studentId === 'object' ? `${submission.studentId.firstName} ${submission.studentId.lastName}` : '') : '________________________'}</span>
        </div>
        <div className="border-b border-dashed border-muted-foreground pb-1 print:border-slate-400">
          <span className="text-xs font-bold uppercase text-muted-foreground mr-2 print:text-slate-700">Classe :</span>
          <span className="text-sm font-semibold">{typeof assignment.classId === 'object' ? (assignment.classId as any).name : '________________________'}</span>
        </div>
        <div className="border-b border-dashed border-muted-foreground pb-1 col-span-2 print:border-slate-400">
          <span className="text-xs font-bold uppercase text-muted-foreground mr-2 print:text-slate-700">Consignes :</span>
          <span className="text-sm italic">{assignment.description}</span>
        </div>
      </div>
    </div>
  );

  // --- Content grouping ---
  const questionsByExercise = assignment.questions?.reduce((acc, q) => {
    const ex = q.exercise || "Questions Générales";
    if (!acc[ex]) acc[ex] = [];
    acc[ex].push(q);
    return acc;
  }, {} as Record<string, Question[]>);

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" className="gap-2" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <div className="flex items-center gap-2">
          {assignment.isWorksheet && (
            <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimer / PDF
            </Button>
          )}
          <Badge variant="outline" className="px-3 py-1">
            {assignment.type.toUpperCase()}
          </Badge>
          {submission ? (
            <Badge className={cn(submission.status === "graded" ? "bg-green-500" : "bg-blue-500")}>
              {submission.status === "graded" ? "Noté" : "Soumis"}
            </Badge>
          ) : isOverdue ? (
            <Badge variant="destructive">En retard</Badge>
          ) : (
            <Badge variant="secondary">À faire</Badge>
          )}
        </div>
      </div>

      <div className={cn("grid grid-cols-1 gap-6", (!assignment.isWorksheet || mode === 'teacher') && "lg:grid-cols-3")}>
        {/* Main Content Area */}
        <div className={cn((!assignment.isWorksheet || mode === 'teacher') ? "lg:col-span-2" : "max-w-4xl mx-auto w-full")}>
          <Card className={cn(
            "border-none shadow-sm overflow-hidden transition-all",
            assignment.isWorksheet && "bg-white text-slate-900 border-2 border-slate-100 shadow-xl print:shadow-none print:border-none p-8 sm:p-12 min-h-[1056px] relative"
          )}>
            {!assignment.isWorksheet ? <ClassicHeader /> : <WorksheetHeader />}

            <CardContent className={cn("pt-0 space-y-8", !assignment.isWorksheet && "pt-8")}>
              {/* Instructions for Classic View */}
              {!assignment.isWorksheet && (
                <section>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Instructions
                  </h3>
                  <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed italic">
                    {assignment.description}
                  </div>
                </section>
              )}

              {/* Resources / Attachments */}
              {assignment.attachments && assignment.attachments.length > 0 && (
                <section className="print:hidden">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Paperclip className="h-5 w-5 text-primary" />
                    Ressources jointes
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {assignment.attachments.map((url, idx) => (
                      <a
                        key={idx}
                        href={url.startsWith('http') ? url : `http://localhost:5000${url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors group"
                      >
                        <div className="p-2 rounded bg-background border group-hover:border-primary transition-colors">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium truncate">Document {idx + 1}</span>
                      </a>
                    ))}
                  </div>
                </section>
              )}

              {/* Questions Area */}
              {assignment.isWorksheet && questionsByExercise ? (
                <div className="space-y-12">
                  {Object.entries(questionsByExercise).map(([exercise, qs], idx) => (
                    <div key={idx} className="space-y-6">
                      <h3 className="text-xl font-black uppercase text-slate-800 border-l-4 border-primary pl-4 print:border-slate-800">{exercise}</h3>
                      <div className="space-y-8">
                        {qs.map((q, qidx) => (
                          <div key={q.id} className="space-y-4">
                            <p className="text-lg font-bold text-slate-700">{qidx + 1}. {q.text}</p>

                            {q.type === 'qcm' ? (
                              <RadioGroup
                                value={answers[q.id] || ""}
                                onValueChange={(v) => handleAnswerChange(q.id, v)}
                                disabled={!!submission || mode === 'teacher'}
                                className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-4"
                              >
                                {q.options?.map((opt) => (
                                  <div key={opt.id} className="flex items-center space-x-2 group">
                                    <RadioGroupItem value={opt.id} id={`ws-opt-${opt.id}`} className="print:border-slate-400" />
                                    <Label htmlFor={`ws-opt-${opt.id}`} className="font-medium cursor-pointer group-hover:text-primary transition-colors">
                                      {opt.text}
                                    </Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            ) : (
                              <div className="ml-4 space-y-2">
                                {!!submission || (mode === 'teacher' && answers[q.id]) ? (
                                  <div className={cn(
                                    "p-4 rounded-lg bg-slate-50 border-l-4 border-slate-200 min-h-[60px] italic print:bg-white print:border-slate-300 relative",
                                    mode === 'teacher' && q.type === 'short_answer' && q.correctAnswer && (
                                      answers[q.id]?.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
                                        ? "border-green-500 bg-green-50/50"
                                        : "border-red-500 bg-red-50/50"
                                    )
                                  )}>
                                    <p className="text-slate-800">{answers[q.id] || "Aucune réponse fournie."}</p>

                                    {mode === 'teacher' && q.type === 'short_answer' && q.correctAnswer && (
                                      <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                                        <p className="text-xs font-bold uppercase text-slate-500">Réponse attendue : <span className="text-slate-900 ml-1">{q.correctAnswer}</span></p>
                                        {answers[q.id]?.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase() ? (
                                          <Badge className="bg-green-500 h-5 px-1.5"><CheckCircle2 className="h-3 w-3 mr-1" /> Correct</Badge>
                                        ) : (
                                          <Badge variant="destructive" className="h-5 px-1.5"><X className="h-3 w-3 mr-1" /> Incorrect</Badge>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <Textarea
                                    placeholder="Votre réponse ici..."
                                    value={answers[q.id] || ""}
                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                    className="min-h-[100px] border-none bg-slate-50 focus-visible:ring-0 focus-visible:ring-offset-0 border-b-2 border-slate-300 rounded-none resize-none"
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <section className="mt-8 pt-8 border-t">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <GraduationCap className="h-6 w-6 text-primary" />
                      Questions du devoir
                    </h3>
                    {mode === 'student' && !submission && hasQuestions && (
                      <Badge variant="secondary" className="text-xs">
                        {answeredCount}/{totalQuestions} répondues
                      </Badge>
                    )}
                  </div>

                  {assignment.questions && assignment.questions.length > 0 ? (
                    <>
                      {mode === 'student' && !submission && (
                        <div className="mb-6">
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-300"
                              style={{ width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="space-y-8">
                        {assignment.questions.map((q, idx) => (
                          <div key={q.id} className="space-y-4 p-4 rounded-xl border bg-muted/10">
                            <div className="flex justify-between items-start">
                              <span className="text-sm font-bold text-primary uppercase tracking-wider">
                                {q.exercise ? `${q.exercise} — ` : ''}Question {idx + 1}
                              </span>
                              <Badge variant="secondary">{q.points} points</Badge>
                            </div>
                            <p className="text-lg font-medium">{q.text}</p>

                            {q.type === 'qcm' ? (
                              <RadioGroup
                                value={answers[q.id] || ""}
                                onValueChange={(v) => handleAnswerChange(q.id, v)}
                                disabled={!!submission || mode === 'teacher'}
                                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                              >
                                {q.options?.map((opt) => {
                                  const isSelected = answers[q.id] === opt.id;
                                  const isCorrect = opt.isCorrect;
                                  const showResults = !!submission || mode === 'teacher';

                                  return (
                                    <div
                                      key={opt.id}
                                      className={cn(
                                        "flex items-center space-x-3 p-4 rounded-lg border transition-all relative overflow-hidden",
                                        !showResults && isSelected && "border-primary bg-primary/5 ring-1 ring-primary",
                                        !showResults && !isSelected && "bg-background hover:border-primary/50",
                                        showResults && isCorrect && "border-green-500 bg-green-50",
                                        showResults && isSelected && !isCorrect && "border-red-500 bg-red-50"
                                      )}
                                    >
                                      <RadioGroupItem value={opt.id} id={`opt-${q.id}-${opt.id}`} />
                                      <Label htmlFor={`opt-${q.id}-${opt.id}`} className="flex-1 cursor-pointer font-medium flex justify-between items-center">
                                        {opt.text}
                                        {showResults && isCorrect && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                                        {showResults && isSelected && !isCorrect && <X className="h-4 w-4 text-red-600" />}
                                      </Label>
                                    </div>
                                  );
                                })}
                              </RadioGroup>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <Label>Votre réponse</Label>
                                  {submission && q.type === 'short_answer' && q.correctAnswer && (
                                    <div className="flex items-center gap-1.5">
                                      {answers[q.id]?.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase() ? (
                                        <Badge className="bg-green-500 hover:bg-green-600 h-5 px-1.5"><CheckCircle2 className="h-3 w-3 mr-1" /> Correct</Badge>
                                      ) : (
                                        <Badge variant="destructive" className="h-5 px-1.5"><X className="h-3 w-3 mr-1" /> Incorrect</Badge>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <Textarea
                                  placeholder="Saisissez votre réponse ici..."
                                  value={answers[q.id] || ""}
                                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                  disabled={!!submission || mode === 'teacher'}
                                  className={cn(
                                    "min-h-[80px]",
                                    submission && q.type === 'short_answer' && q.correctAnswer && (
                                      answers[q.id]?.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
                                        ? "border-green-500 bg-green-50/30"
                                        : "border-red-500 bg-red-50/30"
                                    )
                                  )}
                                />
                                {submission && q.type === 'short_answer' && q.correctAnswer && answers[q.id]?.trim().toLowerCase() !== q.correctAnswer.trim().toLowerCase() && (
                                  <p className="text-xs text-green-700 font-medium">Réponse attendue : <span className="italic">{q.correctAnswer}</span></p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="p-12 text-center border-2 border-dashed rounded-2xl bg-muted/10">
                      <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                      <h4 className="font-bold text-lg text-muted-foreground">Aucun questionnaire disponible</h4>
                      <p className="text-sm text-muted-foreground mt-2">
                        Ce devoir ne contient pas de questions structurées ou le questionnaire est en cours de traitement.
                      </p>
                    </div>
                  )}
                </section>
              )}

              {/* Rubric View */}
              {assignment.rubric && assignment.rubric.length > 0 && (
                <section className="mt-8 pt-8 border-t print:hidden">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Star className="h-6 w-6 text-yellow-500" />
                    Grille d'évaluation
                  </h3>
                  <div className="space-y-6">
                    {assignment.rubric.map((item) => (
                      <div key={item.id} className="p-4 rounded-xl border bg-muted/5">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-bold text-lg">{item.criteria}</h4>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                          <Badge variant="outline">{item.maxPoints} pts max</Badge>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {[0, Math.floor(item.maxPoints / 2), item.maxPoints].map((p) => {
                            const isStudentSelected = submission?.selfReview?.find(r => r.rubricId === item.id)?.score === p;
                            const isTeacherSelected = selfReview[item.id] === p;

                            return (
                              <Button
                                key={p}
                                type="button"
                                variant={isTeacherSelected ? "default" : isStudentSelected ? "secondary" : "outline"}
                                size="sm"
                                className={cn(
                                  "rounded-full relative",
                                  isStudentSelected && !isTeacherSelected && "border-dashed border-primary"
                                )}
                                onClick={() => {
                                  if ((mode === 'student' && !submission) || (mode === 'teacher' && submission && submission.status !== 'graded')) {
                                    handleSelfReviewChange(item.id, p);
                                  }
                                }}
                                disabled={!!submission && mode === 'student'}
                              >
                                {p} pts
                                {isStudentSelected && (
                                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                  </span>
                                )}
                              </Button>
                            );
                          })}
                        </div>
                        {submission?.selfReview?.some(r => r.rubricId === item.id) && (
                          <p className="text-[10px] mt-2 text-muted-foreground italic flex items-center gap-1">
                            <User className="h-3 w-3" /> Auto-évaluation de l'élève : {submission.selfReview.find(r => r.rubricId === item.id)?.score} pts
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {mode === 'teacher' && submission?.status !== 'graded' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full border-dashed"
                      onClick={() => {
                        const total = Object.values(selfReview).reduce((acc, curr) => acc + curr, 0);
                        setGrade(total);
                      }}
                    >
                      <Sparkles className="h-4 w-4 mr-2 text-primary" />
                      Calculer la note totale depuis la grille
                    </Button>
                  )}
                </section>
              )}
            </CardContent>
          </Card>

          {/* Submission Form (Student ONLY) */}
          {mode === "student" && !submission && (
            <Card className="border-none shadow-sm mt-6 print:hidden">
              <CardHeader>
                <CardTitle className="text-xl">Soumettre mon travail</CardTitle>
                <CardDescription>
                  {hasQuestions
                    ? "Répondez aux questions ci-dessus, puis validez votre soumission."
                    : "Joignez votre fichier ou lien pour envoyer votre rendu."
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Un petit mot pour le professeur ? (optionnel)</Label>
                  <Textarea
                    placeholder="Expliquez brièvement votre travail..."
                    className="min-h-[80px]"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>

                {/* File/Link section — optional when questions exist */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Joindre un fichier ou un lien {hasQuestions ? "(optionnel)" : ""}</Label>
                  </div>
                  <RadioGroup value={type} onValueChange={(v: any) => setType(v)} className="flex gap-6">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="file" id="file-rd" />
                      <Label htmlFor="file-rd" className="cursor-pointer">Fichier joint</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="link" id="link-rd" />
                      <Label htmlFor="link-rd" className="cursor-pointer">Lien externe</Label>
                    </div>
                  </RadioGroup>
                </div>

                {type === "file" ? (
                  <div className="space-y-2">
                    <div
                      className="border-2 border-dashed rounded-xl p-6 text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                      />
                      <div className="flex flex-col items-center gap-2">
                        <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Upload className="h-6 w-6 text-primary" />
                        </div>
                        {file ? (
                          <div className="flex items-center gap-2 text-foreground font-medium">
                            {file.name}
                            <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="h-6 w-6">
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <p className="font-medium text-foreground text-sm">Cliquez pour ajouter un fichier</p>
                            <p className="text-xs text-muted-foreground">PDF, Image, ZIP... 10Mo max</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="https://..."
                        className="pl-10"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <Button
                  className="w-full h-12 text-lg"
                  disabled={isSubmitDisabled}
                  onClick={handleSubmit}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  {hasQuestions ? "Envoyer mes réponses" : "Finaliser ma soumission"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Teacher's view of student's generic content (if any) */}
          {mode === 'teacher' && submission && (
            <Card className="border-none shadow-sm mt-6 print:hidden">
              <CardHeader><CardTitle className="text-lg">Détails du rendu</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {submission.content && (
                  <div className="p-4 rounded-lg bg-muted/30 border italic">"{submission.content}"</div>
                )}
                <div className="flex flex-wrap gap-2">
                  {submission.attachments?.map((url, idx) => (
                    <Button key={idx} variant="outline" size="sm" asChild className="gap-2">
                      <a href={url.startsWith('http') ? url : `http://localhost:5000${url}`} target="_blank" rel="noopener noreferrer">
                        <Upload className="h-4 w-4" /> Justificatif {idx + 1}
                      </a>
                    </Button>
                  ))}
                  {submission.linkUrl && (
                    <Button variant="outline" size="sm" asChild className="gap-2">
                      <a href={submission.linkUrl} target="_blank" rel="noopener noreferrer">
                        <LinkIcon className="h-4 w-4" /> Lien du projet
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Status & Evaluation (Sticky) */}
        <div className="space-y-6 print:hidden">
          <Card className="border-none shadow-sm sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Statut & Évaluation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center p-6 bg-muted/20 rounded-2xl border-2 border-dashed">
                {submission?.status === "graded" ? (
                  <>
                    <div className="text-4xl font-extrabold text-primary mb-1">
                      {submission.grade}
                      <span className="text-xl text-muted-foreground font-medium ml-1">/{assignment.maxPoints}</span>
                    </div>
                    <p className="text-sm font-semibold text-green-600 uppercase tracking-tighter">Évaluation terminée</p>
                  </>
                ) : studentAutoScore ? (
                  <>
                    <div className="text-4xl font-extrabold text-primary mb-1">
                      {studentAutoScore.autoGrade}
                      <span className="text-xl text-muted-foreground font-medium ml-1">/{assignment.maxPoints}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Badge className="bg-green-500 hover:bg-green-600 mb-1">Auto-corrigé</Badge>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase text-center">Note provisoire (questions courtes)</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-4xl font-extrabold text-muted-foreground mb-1">
                      --
                      <span className="text-xl font-medium ml-1">/{assignment.maxPoints}</span>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">En attente de notation</p>
                  </>
                )}
              </div>

              {submission?.feedback && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Feedback Professeur
                  </h4>
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-sm italic">
                    {submission.feedback}
                  </div>
                </div>
              )}

              {mode === "teacher" && submission && submission.status !== "graded" && (
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    Attribuer une note
                  </h4>

                  {/* Auto-correction QCM */}
                  {hasAutoCorrectableQuestions && qcmResults && (
                    <div className="p-4 rounded-xl bg-muted/30 border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          Correction automatique
                        </span>
                        <Badge variant="secondary">
                          {qcmResults.autoGrade}/{qcmResults.totalPoints} pts
                        </Badge>
                      </div>
                      <div className="space-y-1.5">
                        {qcmResults.details.map((d, i) => {
                          const q = assignment.questions?.find(q => q.id === d.questionId);
                          return (
                            <div key={d.questionId} className="flex items-center justify-between text-xs">
                              <span className="truncate flex-1">Q{i + 1}: {q?.text?.substring(0, 40)}...</span>
                              <span className={cn("font-bold ml-2", d.correct ? "text-green-600" : (q?.type === 'long_answer' ? "text-muted-foreground" : "text-destructive"))}>
                                {q?.type === 'long_answer' ? 'Manuel' : (d.correct ? `+${d.points}` : '0')}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-dashed gap-2"
                        onClick={() => setGrade(qcmResults.autoGrade)}
                      >
                        <Sparkles className="h-4 w-4 text-primary" />
                        Appliquer la note auto ({qcmResults.autoGrade}/{assignment.maxPoints})
                      </Button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Note finale / {assignment.maxPoints}</Label>
                    <Input
                      type="number"
                      max={assignment.maxPoints}
                      min={0}
                      value={grade}
                      onChange={(e) => setGrade(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rétroaction</Label>
                    <Textarea
                      placeholder="Commentaires pour l'élève..."
                      rows={3}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                    />
                  </div>
                  <Button className="w-full" onClick={handleGrade} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Valider l'évaluation
                  </Button>
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <Badge variant="outline" className="capitalize">{assignment.type}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Deadline</span>
                  <span className="font-medium">{dueDate.toLocaleDateString()}</span>
                </div>
                {submission && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Statut</span>
                    <span className={cn("font-bold uppercase tracking-widest text-[10px]", submission.status === "graded" ? "text-green-600" : "text-blue-600")}>
                      {submission.status === "graded" ? "Evalué" : "Remis"}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
