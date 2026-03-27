/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, Clock, AlertCircle, FileText, Save, User, Pencil, ExternalLink, Loader2 } from "lucide-react";
import {
  apiGetAssignmentsByTeacher,
  apiGradeSubmission,
  apiGetPendingSubmissions
} from "@/services/api/assignments.api";
import type { Assignment, AssignmentSubmission } from "@/types/assignment.types";
import { AssignmentDetailView } from "@/components/assignments/AssignmentDetailView";
import { cn } from "@/lib/utils";


export default function TeacherAssignmentCorrection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const [teacherAssignments, setTeacherAssignments] = useState<Assignment[]>([]);
  const [pendingList, setPendingList] = useState<{ assignment: Assignment, submission: AssignmentSubmission }[]>([]);

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("all");
  const [selectedSubmission, setSelectedSubmission] = useState<{ assignment: Assignment; submission: AssignmentSubmission } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const fetchData = useCallback(async () => {
    if (!user?.linkedId) return;
    try {
      setLoading(true);
      const [assignmentsData, pendingData] = await Promise.all([
        apiGetAssignmentsByTeacher(user.linkedId),
        apiGetPendingSubmissions(user.linkedId)
      ]);
      setTeacherAssignments(assignmentsData);
      setPendingList(pendingData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les données.",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCorrection = (assignment: Assignment, submission: AssignmentSubmission) => {
    setSelectedSubmission({ assignment, submission });
  };


  const handleGrade = async (data: { grade: number; feedback: string }) => {
    if (!selectedSubmission) return;

    try {
      setIsSubmitting(true);
      await apiGradeSubmission(
        selectedSubmission.assignment.id,
        (selectedSubmission.submission.studentId as any)._id || selectedSubmission.submission.studentId,
        data
      );

      toast({
        title: "Note enregistrée",
        description: "La correction a été sauvegardée avec succès.",
      });

      setSelectedSubmission(null);
      fetchData(); // Refresh data
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'enregistrer la note.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  // Helper to safely get student name
  const getStudentName = (submission: AssignmentSubmission) => {
    if (typeof submission.studentId === 'object') {
      return `${submission.studentId.lastName} ${submission.studentId.firstName}`;
    }
    return "Élève inconnu";
  };

  // Helper to safely get class name
  const getClassName = (assignment: Assignment) => {
    if (typeof assignment.classId === 'object') {
      return assignment.classId.name;
    }
    return "Classe inconnue";
  };

  const getStatusBadge = (status: AssignmentSubmission["status"]) => {
    switch (status) {
      case "submitted":
        return <Badge className="bg-blue-500">Soumis</Badge>;
      case "late":
        return <Badge variant="destructive">En retard</Badge>;
      case "graded":
        return <Badge className="bg-green-500">Noté</Badge>;
      default:
        return <Badge variant="outline">En attente</Badge>;
    }
  };

  const getTypeIcon = (type: Assignment["type"]) => {
    switch (type) {
      case "devoir": return <FileText className="h-4 w-4" />;
      case "tp": return <CheckCircle className="h-4 w-4" />;
      case "projet": return <AlertCircle className="h-4 w-4" />;
      case "exposé": return <User className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  // Flatten all submissions for history view (graded ones)
  const allGradedSubmissions = teacherAssignments.flatMap(a =>
    (a.submissions || [])
      .filter(s => s.status === 'graded')
      .map(s => ({ assignment: a, submission: s }))
  );

  if (selectedSubmission) {
    return (
      <div className="p-6">
        <AssignmentDetailView
          assignment={selectedSubmission.assignment}
          submission={selectedSubmission.submission}
          mode="teacher"
          onBack={() => setSelectedSubmission(null)}
          onGrade={handleGrade}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  }

  return (

    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Correction des Devoirs</h1>
        <p className="text-muted-foreground">Notez et commentez les travaux de vos élèves</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{pendingList.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Devoirs actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teacherAssignments.filter(a => a.status === "published").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Corrigés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {allGradedSubmissions.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total soumissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teacherAssignments.reduce((acc, a) => acc + (a.submissions?.length || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtrer par devoir</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedAssignmentId} onValueChange={setSelectedAssignmentId}>
            <SelectTrigger className="w-full md:w-[400px]">
              <SelectValue placeholder="Tous les devoirs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les devoirs</SelectItem>
              {teacherAssignments.map((assignment) => (
                <SelectItem key={assignment.id} value={assignment.id}>
                  {assignment.title} - {getClassName(assignment)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            À corriger ({pendingList.length})
          </TabsTrigger>
          <TabsTrigger value="graded" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Corrigés ({allGradedSubmissions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-500">
                <Clock className="h-5 w-5" />
                Soumissions à corriger
              </CardTitle>
              <CardDescription>Cliquez sur une ligne pour noter et commenter</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Élève</TableHead>
                      <TableHead>Devoir</TableHead>
                      <TableHead>Classe</TableHead>
                      <TableHead>Soumis le</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingList
                      .filter(({ assignment }) => selectedAssignmentId === "all" || assignment.id === selectedAssignmentId)
                      .map(({ assignment, submission }) => (
                        <TableRow
                          key={submission.id || submission._id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleOpenCorrection(assignment, submission)}
                        >
                          <TableCell className="font-medium">{getStudentName(submission)}</TableCell>
                          <TableCell className="flex items-center gap-2">
                            {getTypeIcon(assignment.type)}
                            {assignment.title}
                          </TableCell>
                          <TableCell>{getClassName(assignment)}</TableCell>
                          <TableCell>{new Date(submission.submittedAt).toLocaleDateString()}</TableCell>
                          <TableCell>{getStatusBadge(submission.status)}</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">Corriger</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    {pendingList.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Aucune soumission en attente de correction
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="graded" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-500">
                <CheckCircle className="h-5 w-5" />
                Historique des corrections
              </CardTitle>
              <CardDescription>Consultez ou modifiez les notes déjà attribuées</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Élève</TableHead>
                      <TableHead>Devoir</TableHead>
                      <TableHead>Classe</TableHead>
                      <TableHead>Corrigé le</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allGradedSubmissions
                      .filter(({ assignment }) => selectedAssignmentId === "all" || assignment.id === selectedAssignmentId)
                      .map(({ assignment, submission }) => (
                        <TableRow
                          key={submission.id || submission._id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleOpenCorrection(assignment, submission)}
                        >
                          <TableCell className="font-medium">{getStudentName(submission)}</TableCell>
                          <TableCell className="flex items-center gap-2">
                            {getTypeIcon(assignment.type)}
                            {assignment.title}
                          </TableCell>
                          <TableCell>{getClassName(assignment)}</TableCell>
                          <TableCell>{new Date(submission.updatedAt || submission.submittedAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <span className="font-bold text-primary">{submission.grade}</span> / {assignment.maxPoints}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost" className="gap-2">
                              <Pencil className="h-4 w-4" /> Voir / Modifier
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    {allGradedSubmissions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Aucun devoir n'a encore été corrigé
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
