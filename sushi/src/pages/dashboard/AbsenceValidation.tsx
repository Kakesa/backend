import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiGetAllStudents } from "@/services/api/students.api";
import { apiGetAllJustifications, apiReviewJustification } from "@/services/api/absences.api";
import { Student, AbsenceJustification } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X, Clock, FileText, Eye } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AbsenceValidation() {
  const { toast } = useToast();
  const [justifications, setJustifications] = useState<AbsenceJustification[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJustification, setSelectedJustification] = useState<AbsenceJustification | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [justs, studs] = await Promise.all([
        apiGetAllJustifications(),
        apiGetAllStudents()
      ]);
      setJustifications(justs);
      setStudents(studs);
    } catch (err) {
      console.error("Failed to load justifications:", err);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReview = (justification: AbsenceJustification) => {
    setSelectedJustification(justification);
    setReviewNotes("");
    setIsReviewDialogOpen(true);
  };

  const handleApprove = async () => {
    if (selectedJustification) {
      try {
        setIsSubmitting(true);
        await apiReviewJustification(selectedJustification.id, "admin-id", {
          status: "approved",
          reviewNotes
        });
        await loadData();
        toast({
          title: "Justificatif approuvé",
          description: "Le justificatif a été validé avec succès",
        });
        setIsReviewDialogOpen(false);
      } catch (err) {
        toast({
          title: "Erreur",
          description: "Impossible de valider le justificatif",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleReject = async () => {
    if (selectedJustification) {
      try {
        setIsSubmitting(true);
        await apiReviewJustification(selectedJustification.id, "admin-id", {
          status: "rejected",
          reviewNotes
        });
        await loadData();
        toast({
          title: "Justificatif refusé",
          description: "Le justificatif a été refusé",
          variant: "destructive",
        });
        setIsReviewDialogOpen(false);
      } catch (err) {
        toast({
          title: "Erreur",
          description: "Impossible de rejeter le justificatif",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const getStatusBadge = (status: AbsenceJustification["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case "approved":
        return <Badge className="bg-green-500"><Check className="h-3 w-3 mr-1" />Approuvé</Badge>;
      case "rejected":
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Refusé</Badge>;
    }
  };

  const getDocTypeLabel = (type: AbsenceJustification["documentType"]) => {
    switch (type) {
      case "medical": return "Médical";
      case "family": return "Familial";
      case "administrative": return "Administratif";
      case "other": return "Autre";
    }
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : "Inconnu";
  };

  const pendingCount = justifications.filter(j => j.status === "pending").length;
  const approvedCount = justifications.filter(j => j.status === "approved").length;
  const rejectedCount = justifications.filter(j => j.status === "rejected").length;

  const renderTable = (items: AbsenceJustification[]) => {
    if (loading) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Élève</TableHead>
            <TableHead>Date soumission</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Motif</TableHead>
            <TableHead>Document</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                Aucun justificatif dans cette catégorie
              </TableCell>
            </TableRow>
          ) : (
            items.map((justification) => (
              <TableRow key={justification.id}>
                <TableCell className="font-medium">
                  {getStudentName(justification.studentId)}
                </TableCell>
                <TableCell>
                  {format(new Date(justification.submittedAt), "dd/MM/yyyy HH:mm", { locale: fr })}
                </TableCell>
                <TableCell>{getDocTypeLabel(justification.documentType)}</TableCell>
                <TableCell className="max-w-[200px] truncate">{justification.reason}</TableCell>
                <TableCell>
                  {justification.fileName ? (
                    <Button variant="ghost" size="sm">
                      <FileText className="h-4 w-4 mr-1" />
                      Voir
                    </Button>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(justification.status)}</TableCell>
                <TableCell className="text-right">
                  {justification.status === "pending" ? (
                    <Button size="sm" onClick={() => handleReview(justification)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Examiner
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      {justification.reviewNotes || "Traité"}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Validation des justificatifs</h1>
        <p className="text-muted-foreground">
          Examinez et validez les justificatifs d'absence soumis par les parents
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{justifications.length}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            <p className="text-sm text-muted-foreground">En attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-green-500">{approvedCount}</p>
            <p className="text-sm text-muted-foreground">Approuvés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-destructive">{rejectedCount}</p>
            <p className="text-sm text-muted-foreground">Refusés</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            En attente ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="approved">Approuvés ({approvedCount})</TabsTrigger>
          <TabsTrigger value="rejected">Refusés ({rejectedCount})</TabsTrigger>
          <TabsTrigger value="all">Tous ({justifications.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Justificatifs en attente</CardTitle>
              <CardDescription>Ces justificatifs nécessitent votre validation</CardDescription>
            </CardHeader>
            <CardContent>
              {renderTable(justifications.filter(j => j.status === "pending"))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Justificatifs approuvés</CardTitle>
            </CardHeader>
            <CardContent>
              {renderTable(justifications.filter(j => j.status === "approved"))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Justificatifs refusés</CardTitle>
            </CardHeader>
            <CardContent>
              {renderTable(justifications.filter(j => j.status === "rejected"))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Tous les justificatifs</CardTitle>
            </CardHeader>
            <CardContent>
              {renderTable(justifications)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Examiner le justificatif</DialogTitle>
            <DialogDescription>
              Décidez d'approuver ou de refuser ce justificatif
            </DialogDescription>
          </DialogHeader>

          {selectedJustification && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Élève</p>
                  <p className="font-medium">{getStudentName(selectedJustification.studentId)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium">{getDocTypeLabel(selectedJustification.documentType)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Motif</p>
                  <p className="font-medium">{selectedJustification.reason}</p>
                </div>
                {selectedJustification.fileName && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Document joint</p>
                    <Button variant="outline" size="sm" className="mt-1">
                      <FileText className="h-4 w-4 mr-2" />
                      {selectedJustification.fileName}
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Notes de révision (optionnel)</p>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Ajoutez des remarques..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <X className="h-4 w-4 mr-2" />}
              Refuser
            </Button>
            <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Approuver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
