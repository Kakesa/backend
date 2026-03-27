/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { apiGetStudentById } from "@/services/api/students.api";
import { apiGetAllCourses } from "@/services/api/courses.api";
import { apiGetAllSubjects } from "@/services/api/subjects.api";
import { 
  apiGetAbsencesByStudent, 
  apiGetJustificationsByStudent, 
  apiCreateJustification,
  apiUploadJustificationFile
} from "@/services/api/absences.api";
import { 
  Student, 
  AbsenceRecord, 
  Course, 
  Subject, 
  AbsenceJustification as IJustification,
  JustificationStatus,
  DocumentType
} from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, FileText, Clock, Check, X, Plus } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AbsenceJustification() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State
  const [justifications, setJustifications] = useState<IJustification[]>([]);
  const [child, setChild] = useState<Student | null>(null);
  const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [reason, setReason] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType>("medical");
  const [file, setFile] = useState<File | null>(null);
  const [selectedAbsence, setSelectedAbsence] = useState("");
  
  const loadData = useCallback(async () => {
    if (!user?.linkedId) return;
    try {
      setLoading(true);
      const [childData, absData, justData, coursesData, subsData] = await Promise.all([
        apiGetStudentById(user.linkedId),
        apiGetAbsencesByStudent(user.linkedId),
        apiGetJustificationsByStudent(user.linkedId),
        apiGetAllCourses(),
        apiGetAllSubjects()
      ]);
      setChild(childData || null);
      setAbsences(absData || []);
      setJustifications(justData || []);
      setCourses(coursesData || []);
      setSubjects(subsData || []);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.linkedId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const childAbsences = absences.filter(a => {
    const type = (a as any).type || (a as any).status;
    return type === "absent" || type === "late" || type === "partial" || type === "full_day";
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "Le fichier ne doit pas dépasser 5 Mo",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!reason || !selectedAbsence || !child || !user) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const newJustification = await apiCreateJustification({
        absenceId: selectedAbsence,
        studentId: (child as any).id || (child as any)._id,
        parentId: (user as any).id || (user as any)._id,
        reason,
        documentType,
      } as any);

      if (file && (newJustification as any).id) {
        await apiUploadJustificationFile((newJustification as any).id, file);
      }

      await loadData();
      
      toast({
        title: "Justificatif soumis",
        description: "Votre justificatif a été envoyé pour validation",
      });

      // Reset form
      setReason("");
      setFile(null);
      setSelectedAbsence("");
      setIsDialogOpen(false);
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de soumettre le justificatif",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: JustificationStatus | string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case "approved":
        return <Badge className="bg-green-500"><Check className="h-3 w-3 mr-1" />Approuvé</Badge>;
      case "rejected":
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Refusé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDocTypeLabel = (type: DocumentType | string) => {
    switch (type) {
      case "medical": return "Médical";
      case "family": return "Familial";
      case "administrative": return "Administratif";
      case "other": return "Autre";
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Justificatifs d'absence</h1>
          <p className="text-muted-foreground">
            Soumettez des justificatifs pour les absences de {child?.firstName}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau justificatif
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Soumettre un justificatif</DialogTitle>
              <DialogDescription>
                Uploadez un document pour justifier une absence
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Absence à justifier *</Label>
                <Select value={selectedAbsence} onValueChange={setSelectedAbsence}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une absence" />
                  </SelectTrigger>
                  <SelectContent>
                    {childAbsences.map((absence) => {
                      const courseId = typeof absence.courseId === "object" ? (absence.courseId as any)._id : absence.courseId;
                      const course = courses.find(c => c.id === courseId);
                      const rawSubjectId = course?.subjectId;
                      const subjectId = typeof rawSubjectId === "object" ? (rawSubjectId as any)._id : rawSubjectId;
                      const subject = course ? subjects.find(s => s.id === subjectId) : null;
                      return (
                        <SelectItem key={(absence as any).id || (absence as any)._id} value={(absence as any).id || (absence as any)._id}>
                          {format(new Date(absence.date), "dd/MM/yyyy", { locale: fr })} - {subject?.name || "Journée complète"} ({(absence as any).type || (absence as any).status})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Type de justificatif *</Label>
                <Select value={documentType} onValueChange={(v) => setDocumentType(v as DocumentType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medical">Certificat médical</SelectItem>
                    <SelectItem value="family">Motif familial</SelectItem>
                    <SelectItem value="administrative">Convocation administrative</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Motif de l'absence *</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Expliquez le motif de l'absence..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Document justificatif</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {file ? file.name : "Cliquez pour uploader (PDF, DOC, JPG - max 5 Mo)"}
                    </p>
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Soumettre
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{childAbsences.length}</p>
            <p className="text-sm text-muted-foreground">Absences totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-yellow-500">
              {justifications.filter(j => j.status === "pending").length}
            </p>
            <p className="text-sm text-muted-foreground">En attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-green-500">
              {justifications.filter(j => j.status === "approved").length}
            </p>
            <p className="text-sm text-muted-foreground">Approuvés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-destructive">
              {justifications.filter(j => j.status === "rejected").length}
            </p>
            <p className="text-sm text-muted-foreground">Refusés</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des justificatifs */}
      <Card>
        <CardHeader>
          <CardTitle>Mes justificatifs soumis</CardTitle>
          <CardDescription>Historique des justificatifs envoyés</CardDescription>
        </CardHeader>
        <CardContent>
          {justifications.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucun justificatif soumis
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date de soumission</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Motif</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Remarques</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {justifications.map((justification) => (
                  <TableRow key={(justification as any).id || (justification as any)._id}>
                    <TableCell>
                      {format(new Date(justification.submittedAt), "dd/MM/yyyy HH:mm", { locale: fr })}
                    </TableCell>
                    <TableCell>{getDocTypeLabel(justification.documentType)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{justification.reason}</TableCell>
                    <TableCell>
                      {justification.fileName ? (
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4 mr-1" />
                          {justification.fileName}
                        </Button>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(justification.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {justification.reviewNotes || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
