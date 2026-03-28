/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  CheckCircle2, 
  X,
  MessageSquare,
  ListChecks,
  AlignLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Question, QuestionType, QuestionOption } from "@/types/assignment.types";

interface QuestionBuilderProps {
  questions: Question[];
  onChange: (questions: Question[]) => void;
}

const QUESTION_TYPE_LABELS: Record<QuestionType, { label: string; icon: any; color: string }> = {
  qcm: { label: "QCM", icon: ListChecks, color: "text-blue-600 bg-blue-50" },
  short_answer: { label: "Réponse courte", icon: MessageSquare, color: "text-orange-600 bg-orange-50" },
  long_answer: { label: "Réponse longue", icon: AlignLeft, color: "text-purple-600 bg-purple-50" },
};

export function QuestionBuilder({ questions, onChange }: QuestionBuilderProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addQuestion = (type: QuestionType) => {
    const newQ: Question = {
      id: generateId(),
      text: "",
      type,
      points: 5,
      options: type === "qcm" ? [
        { id: generateId(), text: "", isCorrect: true },
        { id: generateId(), text: "", isCorrect: false },
      ] : undefined,
    };
    onChange([...questions, newQ]);
    setExpandedId(newQ.id);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    onChange(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string) => {
    onChange(questions.filter(q => q.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const addOption = (questionId: string) => {
    const q = questions.find(q => q.id === questionId);
    if (!q) return;
    const newOpts = [...(q.options || []), { id: generateId(), text: "", isCorrect: false }];
    updateQuestion(questionId, { options: newOpts });
  };

  const updateOption = (questionId: string, optionId: string, updates: Partial<QuestionOption>) => {
    const q = questions.find(q => q.id === questionId);
    if (!q) return;
    const newOpts = q.options?.map(o => {
      if (o.id === optionId) return { ...o, ...updates };
      // If setting this one as correct, unset others
      if (updates.isCorrect === true) return { ...o, isCorrect: false };
      return o;
    });
    updateQuestion(questionId, { options: newOpts });
  };

  const removeOption = (questionId: string, optionId: string) => {
    const q = questions.find(q => q.id === questionId);
    if (!q) return;
    updateQuestion(questionId, { options: q.options?.filter(o => o.id !== optionId) });
  };

  return (
    <div className="space-y-4">
      {/* Question list */}
      {questions.map((q, idx) => {
        const typeInfo = QUESTION_TYPE_LABELS[q.type];
        const Icon = typeInfo.icon;
        const isExpanded = expandedId === q.id;

        return (
          <Card 
            key={q.id} 
            className={cn(
              "transition-all border",
              isExpanded ? "ring-2 ring-primary/20 shadow-md" : "hover:shadow-sm cursor-pointer"
            )}
          >
            <CardContent className="p-4">
              {/* Collapsed header */}
              <div 
                className="flex items-center gap-3"
                onClick={() => setExpandedId(isExpanded ? null : q.id)}
              >
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", typeInfo.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">Q{idx + 1}</span>
                    <Badge variant="outline" className="text-[10px] h-5">{typeInfo.label}</Badge>
                    <Badge variant="secondary" className="text-[10px] h-5">{q.points} pts</Badge>
                  </div>
                  <p className="text-sm font-medium truncate mt-0.5">
                    {q.text || <span className="italic text-muted-foreground">Question sans titre...</span>}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-destructive shrink-0"
                  onClick={(e) => { e.stopPropagation(); removeQuestion(q.id); }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Expanded editor */}
              {isExpanded && (
                <div className="mt-4 space-y-4 pt-4 border-t">
                  <div className="grid grid-cols-[1fr,auto] gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Intitulé de la question</Label>
                      <Textarea
                        placeholder="Saisissez votre question ici..."
                        value={q.text}
                        onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                        className="min-h-[60px] resize-none"
                      />
                    </div>
                    <div className="space-y-1.5 w-20">
                      <Label className="text-xs">Points</Label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={q.points}
                        onChange={(e) => updateQuestion(q.id, { points: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Exercice (regroupement optionnel)</Label>
                    <Input
                      placeholder="Ex: Exercice 1 : Les Temps Verbaux"
                      value={q.exercise || ""}
                      onChange={(e) => updateQuestion(q.id, { exercise: e.target.value || undefined })}
                    />
                  </div>

                  {/* QCM Options */}
                  {q.type === "qcm" && (
                    <div className="space-y-2">
                      <Label className="text-xs">Options (cliquez sur le cercle pour marquer la bonne réponse)</Label>
                      {q.options?.map((opt, oi) => (
                        <div key={opt.id} className="flex items-center gap-2">
                          <button
                            type="button"
                            className={cn(
                              "h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors",
                              opt.isCorrect 
                                ? "border-green-500 bg-green-500 text-white" 
                                : "border-muted-foreground/30 hover:border-green-400"
                            )}
                            onClick={() => updateOption(q.id, opt.id, { isCorrect: true })}
                          >
                            {opt.isCorrect && <CheckCircle2 className="h-3 w-3" />}
                          </button>
                          <Input
                            className="flex-1 h-9"
                            placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                            value={opt.text}
                            onChange={(e) => updateOption(q.id, opt.id, { text: e.target.value })}
                          />
                          {(q.options?.length || 0) > 2 && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 shrink-0"
                              onClick={() => removeOption(q.id, opt.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {(q.options?.length || 0) < 6 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs w-full border border-dashed"
                          onClick={() => addOption(q.id)}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Ajouter une option
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Short answer expected */}
                  {q.type === "short_answer" && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Réponse attendue (pour correction auto, optionnel)</Label>
                      <Input
                        placeholder="La bonne réponse..."
                        value={q.correctAnswer || ""}
                        onChange={(e) => updateQuestion(q.id, { correctAnswer: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Add question buttons */}
      <div className="flex flex-wrap gap-2 pt-2">
        {(Object.entries(QUESTION_TYPE_LABELS) as [QuestionType, any][]).map(([type, info]) => {
          const Icon = info.icon;
          return (
            <Button
              key={type}
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 border-dashed"
              onClick={() => addQuestion(type)}
            >
              <Icon className="h-3.5 w-3.5" />
              {info.label}
            </Button>
          );
        })}
      </div>

      {questions.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-lg">
          Ajoutez des questions ci-dessus ou utilisez l'IA pour les générer.
        </p>
      )}
    </div>
  );
}
