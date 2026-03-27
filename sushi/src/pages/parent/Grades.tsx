/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Download, Loader2, User } from "lucide-react";
import { apiGetParentById } from "@/services/api/parents.api";
import { apiGetGradesByStudentAndTrimester, apiCalculateStudentAverage, apiGetGradesByStudent } from "@/services/api/grades.api";
import { generateBulletinPDF } from "@/lib/pdfGenerator";
import { generateBulletinGenericPDF } from "@/lib/bulletinEngine";
import { generatePortraitDRCBulletin } from "@/lib/bulletinPortraitDRC";
import { generateAnnualBulletinPDF } from "@/lib/bulletinPDFEnhanced";
import { bulletinFormats, getFormatsForLevel } from "@/lib/bulletinRegistry";
import { getCurrentSchool } from "@/data/schoolData";
import { apiGetCurrentSchool } from "@/services/api/schools.api";
import type { Grade, Student } from "@/types";

export default function ParentGrades() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [selectedTrimester, setSelectedTrimester] = useState<string>("1");
  const [bulletinFormat, setBulletinFormat] = useState<string>("standard");

  const [grades, setGrades] = useState<Grade[]>([]);
  const [average, setAverage] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch children
  useEffect(() => {
    const fetchChildren = async () => {
      if (!user?.linkedId) return;
      try {
        setLoading(true);
        const parentData = await apiGetParentById(user.linkedId);
        if (parentData.children && parentData.children.length > 0) {
          setChildren(parentData.children);
          setSelectedChildId(parentData.children[0].id);
        }
      } catch (error) {
        console.error("Error fetching children:", error);
        toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les enfants." });
      } finally {
        setLoading(false);
      }
    };
    fetchChildren();
  }, [user, toast]);

  // Fetch Grades
  useEffect(() => {
    const fetchGrades = async () => {
      if (!selectedChildId) return;
      try {
        setLoading(true);
        if (selectedTrimester === "annual") {
          // Fetch all grades for annual recap
          const allData = await apiGetGradesByStudent(selectedChildId);
          setGrades(allData);
          // Calculate overall average across all trimesters
          let totalCoef = 0, totalPoints = 0;
          allData.forEach(g => {
            const sub = typeof g.subjectId === 'object' ? g.subjectId : null;
            const coef = sub?.coefficient || 1;
            if (g.moyenne !== null) {
              totalCoef += coef;
              totalPoints += (g.moyenne || 0) * coef;
            }
          });
          setAverage(totalCoef > 0 ? totalPoints / totalCoef : 0);
        } else {
          const data = await apiGetGradesByStudentAndTrimester(selectedChildId, parseInt(selectedTrimester));
          setGrades(data);
          const avg = await apiCalculateStudentAverage(selectedChildId, parseInt(selectedTrimester));
          setAverage(avg);
        }
      } catch (error) {
        console.error("Error fetching grades:", error);
        toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les notes." });
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, [selectedChildId, selectedTrimester, toast]);

  const selectedChild = children.find(c => c.id === selectedChildId);

  const getMentionBadge = (avg: number) => {
    if (avg >= 16) return <Badge className="bg-green-500">Très Bien</Badge>;
    if (avg >= 14) return <Badge className="bg-blue-500">Bien</Badge>;
    if (avg >= 12) return <Badge className="bg-yellow-500">Assez Bien</Badge>;
    if (avg >= 10) return <Badge className="bg-orange-500">Passable</Badge>;
    return <Badge variant="destructive">Insuffisant</Badge>;
  };
  const handleDownloadBulletin = async () => {
    if (!selectedChild) return;
    // Try backend school first, fallback to local mock
    let school: any = getCurrentSchool();
    try {
      const backendSchool = await apiGetCurrentSchool();
      if (backendSchool) school = backendSchool;
    } catch { /* fallback */ }
    if (!school) return;

    try {
      // Annual recap bulletin
      if (selectedTrimester === "annual") {
        const allGrades = await apiGetGradesByStudent(selectedChildId);
        const backSchool = await apiGetCurrentSchool();
        await generatePortraitDRCBulletin({
          student: selectedChild,
          grades: allGrades.map(g => ({
            ...g,
            subjectId: typeof g.subjectId === 'object' ? g.subjectId : g.subjectId
          })),
          subjects: (backSchool as any)?.subjects || [],
          academicYear: school.academicYear,
          schoolName: school.name,
          schoolAddress: school.address,
          schoolCode: school.code,
          nPerm: selectedChild.matricule || "N/A",
          province: school.city || "Kinshasa",
          schoolLogo: school.logo,
        });
        toast({
          title: "Bulletin Portrait (Annuel) généré",
          description: `Rapport annuel de ${selectedChild.firstName} téléchargé.`,
        });
        return;
      }
      else if (bulletinFormat === "portrait-drc-semester" || bulletinFormat === "portrait-drc-trimester") {
        const allGrades = await apiGetGradesByStudent(selectedChildId);
        const backSchool = await apiGetCurrentSchool();

        await generatePortraitDRCBulletin({
          student: selectedChild,
          grades: allGrades.map(g => ({
            ...g,
            subjectId: typeof g.subjectId === 'object' ? g.subjectId : g.subjectId
          })),
          subjects: (backSchool as any)?.subjects || [],
          academicYear: school.academicYear,
          schoolName: school.name,
          schoolAddress: school.address,
          schoolCode: school.code,
          nPerm: selectedChild.matricule || "N/A",
          province: school.city || "Kinshasa",
          schoolLogo: school.logo,
          layoutType: bulletinFormat === "portrait-drc-trimester" ? "trimester" : "semester",
        });
      } else if (bulletinFormat !== "standard") {
        const selectedFormat = bulletinFormats.find(f => f.id === bulletinFormat);
        if (!selectedFormat) return;

        const allGrades = await apiGetGradesByStudent(selectedChildId);

        await generateBulletinGenericPDF({
          student: selectedChild,
          grades: allGrades.map(g => ({
            ...g,
            subjectId: typeof g.subjectId === 'object' ? g.subjectId : g.subjectId
          })),
          academicYear: school.academicYear,
          schoolName: school.name,
          schoolAddress: school.address,
          schoolCode: school.code,
          nPerm: "PERM-2024-001",
          province: school.city || "Kinshasa",
          formatConfig: selectedFormat
        });
      } else {
        await generateBulletinPDF({
          student: selectedChild,
          grades,
          trimester: parseInt(selectedTrimester) as 1 | 2 | 3,
          academicYear: school.academicYear,
          schoolName: school.name,
          schoolAddress: school.address,
        });
      }
      toast({ title: "Succès", description: "Bulletin téléchargé avec succès." });
    } catch (e: any) {
      console.error("PDF Generation Error:", e);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Impossible de générer le bulletin : ${e.message || "Erreur inconnue"}`
      });
    }
  };

  if (loading && children.length === 0) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Notes des Enfants</h1>
          <p className="text-muted-foreground">
            Consultez les résultats scolaires de vos enfants
          </p>
        </div>
        {children.length > 1 && (
          <div className="w-[200px]">
            <Select value={selectedChildId} onValueChange={setSelectedChildId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un enfant" />
              </SelectTrigger>
              <SelectContent>
                {children.map(child => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.firstName || child.name} {child.lastName || ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {selectedChild && (
        <>
          {/* Filtres et résumé */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <label className="text-sm font-medium mb-2 block">Trimestre</label>
                <Select value={selectedTrimester} onValueChange={setSelectedTrimester}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1er Trimestre</SelectItem>
                    <SelectItem value="2">2ème Trimestre</SelectItem>
                    <SelectItem value="3">3ème Trimestre</SelectItem>
                    <SelectItem value="annual">Récapitulatif Annuel</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <label className="text-sm font-medium mb-2 block">Format</label>
                <Select value={bulletinFormat} onValueChange={(v: string) => setBulletinFormat(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Classique</SelectItem>
                    {(() => {
                      const currentSchool = getCurrentSchool();
                      if (!currentSchool) return null;
                      const classLevelStr = (selectedChild as any)?.level || "1";
                      const classLevel = parseInt(classLevelStr.toString().replace(/\D/g, '')) || 1;
                      const availableFormats = getFormatsForLevel(currentSchool.types, classLevel, (selectedChild as any)?.section);
                      return availableFormats.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ));
                    })()}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Moyenne générale</p>
                <p className="text-3xl font-bold">{Math.round(average)}/20</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Mention</p>
                <div className="mt-2">{getMentionBadge(average)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-2">Bulletin</p>
                <Button onClick={handleDownloadBulletin} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger PDF
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Tableau des notes */}
          <Card>
            <CardHeader>
              <CardTitle>Détail des notes - {selectedChild.firstName || selectedChild.name}</CardTitle>
              <CardDescription>
                Trimestre {selectedTrimester} - Année 2024-2025
              </CardDescription>
            </CardHeader>
            <CardContent>
              {grades.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucune note disponible pour ce trimestre
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matière</TableHead>
                      <TableHead className="text-center">Max Période</TableHead>
                      <TableHead className="text-center">1ère Période</TableHead>
                      <TableHead className="text-center">2ème Période</TableHead>
                      <TableHead className="text-center">Devoir</TableHead>
                      <TableHead className="text-center">Examen</TableHead>
                      <TableHead className="text-center">Moyenne</TableHead>
                      <TableHead>Appréciation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grades.map((grade) => {

                      const subjectName = typeof grade.subjectId === 'object' ? (grade.subjectId as any).name : 'Matière';
                      const subjectCoef = typeof grade.subjectId === 'object' ? (grade.subjectId as any).coefficient : 1;

                      return (
                        <TableRow key={grade.id}>
                          <TableCell className="font-medium">{subjectName}</TableCell>
                          <TableCell className="text-center">{subjectCoef}</TableCell>
                          <TableCell className="text-center">{grade.interrogation1 ?? "-"}</TableCell>
                          <TableCell className="text-center">{grade.interrogation2 ?? "-"}</TableCell>
                          <TableCell className="text-center">{grade.devoir ?? "-"}</TableCell>
                          <TableCell className="text-center">{grade.examen ?? "-"}</TableCell>
                          <TableCell className="text-center font-bold">
                            <span className={
                              (grade.moyenne || 0) >= 14 ? "text-green-500" :
                                (grade.moyenne || 0) >= 10 ? "text-yellow-600" : "text-red-500"
                            }>
                              {grade.moyenne ? Math.round(grade.moyenne) : "-"}
                            </span>
                          </TableCell>
                          <TableCell>{grade.appreciation}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
