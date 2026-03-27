import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Award, TrendingUp, CheckCircle2, Circle, AlertCircle, BookOpen } from "lucide-react";
import { 
  apiGetAllCompetences, 
  apiGetStudentEvaluations, 
  apiGetCompetenceProgress 
} from "@/services/api/competences.api";
import { apiGetAllSubjects } from "@/services/api/subjects.api";
import type { 
  Subject, 
  Competence, 
  StudentCompetenceEvaluation, 
  CompetenceProgress 
} from "@/types";

interface ParentCompetencesProps {
  studentId: string;
  studentName: string;
}

export default function ParentCompetences({ studentId, studentName }: ParentCompetencesProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [competences, setCompetences] = useState<Competence[]>([]);
  const [evaluations, setEvaluations] = useState<StudentCompetenceEvaluation[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, CompetenceProgress>>({});
  const [selectedTrimester, setSelectedTrimester] = useState<"all" | "1" | "2" | "3">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!studentId) return;
      
      try {
        setLoading(true);
        const [subs, comps, evals] = await Promise.all([
          apiGetAllSubjects(),
          apiGetAllCompetences(),
          apiGetStudentEvaluations(studentId, selectedTrimester === "all" ? undefined : parseInt(selectedTrimester))
        ]);
        
        setSubjects(subs);
        setCompetences(comps);
        setEvaluations(evals);

        // Fetch progress for each competence
        const progressResults = await Promise.all(
          comps.map(c => studentId ? apiGetCompetenceProgress(studentId, c.id) : Promise.resolve(null))
        );
        
        const map: Record<string, CompetenceProgress> = {};
        progressResults.forEach((p, i) => {
          if (p) map[comps[i].id] = p;
        });
        setProgressMap(map);

      } catch (err) {
        console.error("Failed to load competences:", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [studentId, selectedTrimester]);

  // Filter evaluations by selected trimester
  const filteredEvaluations = selectedTrimester === "all" 
    ? evaluations 
    : evaluations.filter(e => e.trimester === parseInt(selectedTrimester));

  // Group competences by subject
  const competencesBySubject = subjects.map(subject => ({
    subject,
    competences: competences.filter(c => c.subjectId === subject.id),
  })).filter(g => g.competences.length > 0);

  // Calculate overall progress
  const totalCompetences = competences.length;
  const acquiredCompetences = Object.values(progressMap).filter(p => p.percentage >= 100);
  const totalAcquired = acquiredCompetences.length;
  const overallProgress = totalCompetences > 0 ? (totalAcquired / totalCompetences) * 100 : 0;

  const getLevelLabel = (level: string) => {
    switch (level) {
      case "non_acquis": return "Non acquis";
      case "en_cours": return "En cours";
      case "acquis": return "Acquis";
      case "expert": return "Expert";
      default: return level;
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "non_acquis":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "en_cours":
        return <Circle className="h-4 w-4 text-yellow-500" />;
      case "acquis":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "expert":
        return <Award className="h-4 w-4 text-purple-500" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "non_acquis":
        return <Badge variant="destructive">{getLevelLabel(level)}</Badge>;
      case "en_cours":
        return <Badge variant="secondary">{getLevelLabel(level)}</Badge>;
      case "acquis":
        return <Badge className="bg-green-500">{getLevelLabel(level)}</Badge>;
      case "expert":
        return <Badge className="bg-purple-500">{getLevelLabel(level)}</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Compétences de {studentName}</h2>
          <p className="text-muted-foreground">
            Suivi de la progression par objectifs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Trimestre:</label>
          <Select value={selectedTrimester} onValueChange={(v) => setSelectedTrimester(v as any)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les trimestres</SelectItem>
              <SelectItem value="1">Trimestre 1</SelectItem>
              <SelectItem value="2">Trimestre 2</SelectItem>
              <SelectItem value="3">Trimestre 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalCompetences}</p>
                <p className="text-sm text-muted-foreground">Compétences totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-500">{totalAcquired}</p>
                <p className="text-sm text-muted-foreground">Acquises</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-yellow-500">
                  {filteredEvaluations.filter(e => e.level === "en_cours").length}
                </p>
                <p className="text-sm text-muted-foreground">En cours</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-purple-500">
                  {filteredEvaluations.filter(e => e.level === "expert").length}
                </p>
                <p className="text-sm text-muted-foreground">Expert</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progression globale */}
      <Card>
        <CardHeader>
          <CardTitle>Progression globale</CardTitle>
          <CardDescription>Avancement dans l'acquisition des compétences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Compétences acquises</span>
              <span className="font-medium">{overallProgress.toFixed(0)}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{totalAcquired}/{totalCompetences} compétences maîtrisées</span>
              <span>{totalCompetences - totalAcquired} restantes</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compétences par matière */}
      {competencesBySubject.map(({ subject, competences: subjectComps }) => (
        <Card key={subject.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {subject.name}
            </CardTitle>
            <CardDescription>
              {subjectComps.length} compétences à acquérir
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {subjectComps.map((comp) => {
                const progress = progressMap[comp.id] || { 
                  total: 0, acquired: 0, inProgress: 0, notAcquired: 0, percentage: 0 
                };
                const compEvaluations = filteredEvaluations.filter(e => e.competenceId === comp.id);

                return (
                  <div key={comp.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="font-medium">{comp.name}</h4>
                        <p className="text-sm text-muted-foreground">{comp.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {comp.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-lg font-bold">{progress.percentage.toFixed(0)}%</p>
                        <p className="text-xs text-muted-foreground">
                          {progress.acquired}/{progress.total} objectifs
                        </p>
                      </div>
                    </div>

                    <Progress value={progress.percentage} className="h-2 mb-4" />

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Objectifs évalués ({compEvaluations.length}/{comp.objectives.length}) :</p>
                      <div className="grid gap-2">
                        {compEvaluations.map((evaluation) => {
                          const objective = comp.objectives.find(obj => obj.id === evaluation.objectiveId);
                          if (!objective) return null;
                          
                          return (
                            <div 
                              key={evaluation.id} 
                              className="flex items-center justify-between p-3 rounded bg-muted/50 border"
                            >
                              <div className="flex items-center gap-3">
                                {getLevelIcon(evaluation.level)}
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{objective.name}</p>
                                  <p className="text-xs text-muted-foreground">{objective.description}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-[10px]">
                                      {objective.level === "beginner" ? "Débutant" : 
                                       objective.level === "intermediate" ? "Intermédiaire" : "Avancé"}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      Trimestre {evaluation.trimester}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {getLevelBadge(evaluation.level)}
                                {evaluation.notes && (
                                  <div className="text-xs text-muted-foreground max-w-[200px] truncate">
                                    "{evaluation.notes}"
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {compEvaluations.length === 0 && (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                          Aucune évaluation enregistrée pour cette compétence
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
      
      {competencesBySubject.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium text-muted-foreground">Aucune compétence définie</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Les compétences n'ont pas encore été configurées pour cet élève.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
