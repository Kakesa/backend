/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Plus, Edit, Eye, FileText, Loader2 } from "lucide-react";
import { apiGetAllClasses } from "@/services/api/classes.api";
import { apiGetStudentsByClass } from "@/services/api/students.api";
import { apiGetTeacherAbsences, apiGetPendingTeacherJustifications } from "@/services/api/absences.api";
import type { Student, Class, AbsenceRecord, AbsenceJustification } from "@/types";

interface Absence {
  _id: string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    matricule: string;
    class?: {
      _id: string;
      name: string;
    };
  };
  startDate: string;
  endDate: string;
  reason?: string;
  status: "unjustified" | "justified" | "pending";
  justificationId?: any;
  createdAt: string;
  updatedAt: string;
}

interface Justification {
  _id: string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    matricule: string;
    class?: {
      _id: string;
      name: string;
    };
  };
  reason: string;
  documentUrl?: string;
  fileName?: string;
  status: "pending" | "approved" | "rejected";
  reviewNotes?: string;
  createdAt: string;
}

interface NewAbsence {
  studentId: string;
  startDate: string;
  endDate: string;
  reason: string;
}

// Fonction pour transformer les données de l'API vers le format du composant
const transformAbsenceRecord = (record: AbsenceRecord, students: Student[]): Absence => {
  const student = students.find(s => s.id === record.studentId);
  
  // Gérer le cas où class peut être une string ou un objet
  let studentClass;
  if (student?.class) {
    if (typeof student.class === 'string') {
      studentClass = {
        _id: student.class,
        name: "Classe inconnue"
      };
    } else {
      studentClass = {
        _id: student.class._id,
        name: student.class.name
      };
    }
  }
  
  return {
    _id: record.id,
    studentId: {
      _id: student?.id || record.studentId,
      firstName: student?.firstName || "Inconnu",
      lastName: student?.lastName || "Inconnu",
      matricule: student?.matricule || "",
      class: studentClass
    },
    startDate: record.date,
    endDate: record.date, // Pour l'instant, même date pour début et fin
    reason: "Absence enregistrée",
    status: record.justified ? "justified" : "unjustified",
    justificationId: record.justificationId,
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: record.updatedAt || new Date().toISOString()
  };
};

// Fonction pour transformer les justifications de l'API vers le format du composant
const transformJustification = (justification: AbsenceJustification, students: Student[]): Justification => {
  const student = students.find(s => s.id === justification.studentId);
  
  // Gérer le cas où class peut être une string ou un objet
  let studentClass;
  if (student?.class) {
    if (typeof student.class === 'string') {
      studentClass = {
        _id: student.class,
        name: "Classe inconnue"
      };
    } else {
      studentClass = {
        _id: student.class._id,
        name: student.class.name
      };
    }
  }
  
  return {
    _id: justification.id,
    studentId: {
      _id: student?.id || justification.studentId,
      firstName: student?.firstName || "Inconnu",
      lastName: student?.lastName || "Inconnu",
      matricule: student?.matricule || "",
      class: studentClass
    },
    reason: justification.reason,
    documentUrl: justification.fileUrl,
    fileName: justification.fileName,
    status: justification.status,
    reviewNotes: justification.reviewNotes,
    createdAt: justification.submittedAt || justification.createdAt || new Date().toISOString()
  };
};

export default function TeacherAbsences() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [justifications, setJustifications] = useState<Justification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [showMarkDialog, setShowMarkDialog] = useState(false);
  const [showJustificationsDialog, setShowJustificationsDialog] = useState(false);
  const [newAbsence, setNewAbsence] = useState<NewAbsence>({
    studentId: "",
    startDate: "",
    endDate: "",
    reason: ""
  });

  // API functions
  const fetchTeacherAbsences = useCallback(async () => {
    console.log("=== fetchTeacherAbsences called ===");
    if (!user?.linkedId) return;
    
    try {
      const params: any = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (dateFilter) params.startDate = dateFilter;

      console.log("Calling apiGetTeacherAbsences with params:", params);
      const data = await apiGetTeacherAbsences(params);
      console.log("Received data:", data);
      
      // Transformer les données de l'API vers le format du composant
      const transformedAbsences = data.map(record => transformAbsenceRecord(record, students));
      setAbsences(transformedAbsences);
      
      toast({
        title: "Succès",
        description: "Données d'absences chargées avec succès",
        variant: "default"
      });
    } catch (error) {
      console.error("Error fetching absences:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les absences",
        variant: "destructive"
      });
    }
  }, [user?.linkedId, statusFilter, dateFilter, toast, students]);

  const fetchClasses = useCallback(async () => {
    if (!user?.linkedId) return;
    
    try {
      const data = await apiGetAllClasses();
      setClasses(data);
      if (data.length > 0) {
        setSelectedClassId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les classes",
        variant: "destructive"
      });
    }
  }, [user?.linkedId]);

  const fetchStudents = useCallback(async (classId: string) => {
    if (!classId) return;
    
    try {
      const data = await apiGetStudentsByClass(classId);
      setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les étudiants",
        variant: "destructive"
      });
    }
  }, []);

  const fetchJustifications = useCallback(async () => {
    console.log("=== fetchJustifications called ===");
    if (!user?.linkedId) return;
    
    try {
      console.log("Calling apiGetPendingTeacherJustifications...");
      const data = await apiGetPendingTeacherJustifications();
      console.log("Received justifications data:", data);
      
      // Transformer les données de l'API vers le format du composant
      const transformedJustifications = data.map(justification => transformJustification(justification, students));
      setJustifications(transformedJustifications);
      
      toast({
        title: "Succès", 
        description: "Justifications chargées avec succès",
        variant: "default"
      });
    } catch (error) {
      console.error("Error fetching justifications:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les justifications",
        variant: "destructive"
      });
    }
  }, [user?.linkedId, toast, students]);

  const markAbsence = async () => {
    if (!newAbsence.studentId || !newAbsence.startDate || !newAbsence.endDate) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/absences/teacher/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newAbsence)
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Absence marquée avec succès"
        });
        setShowMarkDialog(false);
        setNewAbsence({ studentId: "", startDate: "", endDate: "", reason: "" });
        fetchTeacherAbsences();
      } else {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors du marquage de l'absence");
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de marquer l'absence",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const reviewJustification = async (justificationId: string, status: "approved" | "rejected", reviewNotes?: string) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/absences/teacher/justifications/${justificationId}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status, reviewNotes })
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: `Justification ${status === "approved" ? "approuvée" : "rejetée"} avec succès`
        });
        fetchJustifications();
        fetchTeacherAbsences();
      } else {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la révision de la justification");
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de réviser la justification",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await Promise.all([
        fetchClasses(),
        fetchTeacherAbsences(),
        fetchJustifications()
      ]);
      setLoading(false);
    };
    initialize();
  }, [fetchClasses, fetchTeacherAbsences, fetchJustifications]);

  useEffect(() => {
    if (selectedClassId) {
      fetchStudents(selectedClassId);
    }
  }, [selectedClassId, fetchStudents]);

  useEffect(() => {
    fetchTeacherAbsences();
  }, [fetchTeacherAbsences]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "justified":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Justifiée</Badge>;
      case "unjustified":
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Non justifiée</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />En attente</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Absences</h1>
          <p className="text-muted-foreground">Marquez et suivez les absences des étudiants</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showJustificationsDialog} onOpenChange={setShowJustificationsDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Justifications ({justifications.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Justifications en attente</DialogTitle>
                <DialogDescription>
                  Révisez les justifications soumises par les étudiants
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {justifications.map((justification) => (
                  <Card key={justification._id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-semibold">
                            {justification.studentId.firstName} {justification.studentId.lastName}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {justification.studentId.class?.name} • {justification.studentId.matricule}
                          </p>
                        </div>
                        <Badge variant="outline">En attente</Badge>
                      </div>
                      <p className="mb-4">{justification.reason}</p>
                      {justification.documentUrl && (
                        <div className="mb-4">
                          <a 
                            href={justification.documentUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Voir le document
                          </a>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => reviewJustification(justification._id, "approved")}
                          disabled={saving}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approuver
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => reviewJustification(justification._id, "rejected")}
                          disabled={saving}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rejeter
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {justifications.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune justification en attente
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showMarkDialog} onOpenChange={setShowMarkDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Marquer une absence
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Marquer une absence</DialogTitle>
                <DialogDescription>
                  Enregistrez une nouvelle absence pour un étudiant
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="student">Étudiant</Label>
                  <Select value={newAbsence.studentId} onValueChange={(value) => setNewAbsence({...newAbsence, studentId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un étudiant" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.firstName} {student.lastName} ({student.matricule})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Date de début</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={newAbsence.startDate}
                      onChange={(e) => setNewAbsence({...newAbsence, startDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">Date de fin</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={newAbsence.endDate}
                      onChange={(e) => setNewAbsence({...newAbsence, endDate: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="reason">Motif</Label>
                  <Textarea
                    id="reason"
                    placeholder="Motif de l'absence..."
                    value={newAbsence.reason}
                    onChange={(e) => setNewAbsence({...newAbsence, reason: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowMarkDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={markAbsence} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Marquer l'absence
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total absences</p>
                <p className="text-2xl font-bold">{absences.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Justifiées</p>
                <p className="text-2xl font-bold">{absences.filter(a => a.status === "justified").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Non justifiées</p>
                <p className="text-2xl font-bold">{absences.filter(a => a.status === "unjustified").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Justifications en attente</p>
                <p className="text-2xl font-bold">{justifications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des absences</CardTitle>
          <CardDescription>
            Consultez et gérez les absences de vos classes
          </CardDescription>
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une classe" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="justified">Justifiées</SelectItem>
                <SelectItem value="unjustified">Non justifiées</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-[180px]"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Étudiant</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Motif</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {absences
                .filter(absence => 
                  selectedClassId === "" || 
                  absence.studentId.class?._id === selectedClassId
                )
                .map((absence) => (
                <TableRow key={absence._id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {absence.studentId.firstName} {absence.studentId.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {absence.studentId.matricule}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{absence.studentId.class?.name || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(absence.startDate)} - {formatDate(absence.endDate)}
                    </div>
                  </TableCell>
                  <TableCell>{absence.reason || "-"}</TableCell>
                  <TableCell>{getStatusBadge(absence.status)}</TableCell>
                  <TableCell>{formatDate(absence.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {absences.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Aucune absence trouvée
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
