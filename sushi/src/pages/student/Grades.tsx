/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Loader2 } from "lucide-react";
import { apiGetGradesByStudentAndTrimester, apiCalculateStudentAverage, apiGetGradesByStudent } from "@/services/api/grades.api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { Grade } from "@/types";
import { generateBulletinPDF } from "@/lib/pdfGenerator";
import { generateBulletinGenericPDF } from "@/lib/bulletinEngine";
import { generatePortraitDRCBulletin } from "@/lib/bulletinPortraitDRC";
import { bulletinFormats, getFormatsForLevel } from "@/lib/bulletinRegistry";
import { getCurrentSchool } from "@/data/schoolData";
import { apiGetStudentById } from "@/services/api/students.api";

export default function StudentGrades() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [trimester, setTrimester] = useState<"1" | "2" | "3" | "annual">("1");
  const [bulletinFormat, setBulletinFormat] = useState<string>("standard");
  const [grades, setGrades] = useState<Grade[]>([]);
  const [average, setAverage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<any>(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (user?.linkedId) {
        try {
          const student = await apiGetStudentById(user.linkedId);
          setStudentData(student);
        } catch (e) {
          console.error("Error fetching student details", e);
        }
      }
    };
    fetchStudentData();
  }, [user]);

  useEffect(() => {
    const loadGrades = async () => {
      const studentId = studentData?.id || user?.linkedId;
      if (!studentId) return;
      try {
        setLoading(true);
        const data = await apiGetGradesByStudentAndTrimester(studentId, parseInt(trimester));
        setGrades(data);
        const avg = await apiCalculateStudentAverage(studentId, parseInt(trimester));
        setAverage(avg);
      } catch (error) {
        console.error("Error loading grades:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les notes.",
        });
      } finally {
        setLoading(false);
      }
    };
    loadGrades();
  }, [trimester, studentData, user, toast]);

  const handleDownloadBulletin = async () => {
    if (!studentData) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Données de l'élève manquantes.",
      });
      return;
    }

    const currentSchool = getCurrentSchool();
    if (!currentSchool) return;

    try {
      if (trimester === "annual") {
        const allGrades = await apiGetGradesByStudent(user.linkedId!);
        // Determine layout based on school settings
        const school = getCurrentSchool();
        const layoutType = school?.settings?.trimesters === 3 ? "trimester" : "semester";

        await generatePortraitDRCBulletin({
          student: studentData,
          grades: allGrades.map(g => ({
            ...g,
            subjectId: typeof g.subjectId === 'object' ? g.subjectId : g.subjectId
          })),
          subjects: [],
          academicYear: currentSchool.academicYear,
          schoolName: currentSchool.name,
          schoolAddress: currentSchool.address,
          schoolCode: currentSchool.code,
          nPerm: studentData.matricule || "N/A",
          province: currentSchool.city || "Kinshasa",
          schoolLogo: currentSchool.logo,
          layoutType,
        });
        toast({
          title: "Bulletin Portrait (Annuel) généré",
          description: "Votre rapport annuel a été généré avec succès.",
        });
        return;
      }

      if (bulletinFormat === "portrait-drc-semester" || bulletinFormat === "portrait-drc-trimester") {
        const allGrades = await apiGetGradesByStudent(user.linkedId!);

        await generatePortraitDRCBulletin({
          student: studentData,
          grades: allGrades.map(g => ({
            ...g,
            subjectId: typeof g.subjectId === 'object' ? g.subjectId : g.subjectId
          })),
          subjects: [],
          academicYear: currentSchool.academicYear,
          schoolName: currentSchool.name,
          schoolAddress: currentSchool.address,
          schoolCode: currentSchool.code,
          nPerm: studentData.matricule || "N/A",
          province: currentSchool.city || "Kinshasa",
          schoolLogo: currentSchool.logo,
          layoutType: bulletinFormat === "portrait-drc-trimester" ? "trimester" : "semester",
        });
      } else if (bulletinFormat !== "standard") {
        const selectedFormat = bulletinFormats.find(f => f.id === bulletinFormat);
        if (!selectedFormat) return;

        const allGrades = await apiGetGradesByStudent(user.linkedId!);

        await generateBulletinGenericPDF({
          student: studentData,
          grades: allGrades.map(g => ({
            ...g,
            subjectId: typeof g.subjectId === 'object' ? g.subjectId : g.subjectId
          })),
          academicYear: currentSchool.academicYear,
          schoolName: currentSchool.name,
          schoolAddress: currentSchool.address,
          schoolCode: currentSchool.code,
          nPerm: "PERM-2024-001",
          province: "Kinshasa",
          formatConfig: selectedFormat
        });
      } else {
        await generateBulletinPDF({
          student: studentData,
          grades,
          trimester: parseInt(trimester) as 1 | 2 | 3,
          academicYear: currentSchool.academicYear,
          schoolName: currentSchool.name,
          schoolAddress: currentSchool.address,
        });
      }
      toast({
        title: "Bulletin téléchargé",
        description: "Votre bulletin a été généré avec succès.",
      });
    } catch (error: any) {
      console.error("Bulletin Generation Error:", error);
      toast({
        title: "Erreur",
        description: `Impossible de générer le bulletin : ${error.message || "Erreur inconnue"}`,
        variant: "destructive",
      });
    }
  };

  const getMentionBadge = (avg: number) => {
    if (avg >= 18) return <Badge className="bg-green-600">Excellent</Badge>;
    if (avg >= 16) return <Badge className="bg-green-600">Très Bien</Badge>;
    if (avg >= 14) return <Badge className="bg-blue-600">Bien</Badge>;
    if (avg >= 12) return <Badge className="bg-yellow-600">Assez Bien</Badge>;
    if (avg >= 10) return <Badge className="bg-orange-600">Passable</Badge>;
    return <Badge variant="destructive">Insuffisant</Badge>;
  };

  if (loading && !grades.length) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mes Notes</h1>
          <p className="text-muted-foreground">Consultez vos notes par trimestre</p>
        </div>
        <div className="flex gap-3">
          <Select value={trimester} onValueChange={(v) => setTrimester(v as "1" | "2" | "3" | "annual")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trimestre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1er Trimestre</SelectItem>
              <SelectItem value="2">2ème Trimestre</SelectItem>
              <SelectItem value="3">3ème Trimestre</SelectItem>
              <SelectItem value="annual">Récapitulatif Annuel</SelectItem>
            </SelectContent>
          </Select>
          <Select value={bulletinFormat} onValueChange={(v: string) => setBulletinFormat(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Format Classique</SelectItem>
              {(() => {
                const school = getCurrentSchool();
                if (!school) return null;
                const classLevelStr = studentData?.level || "1";
                const classLevel = parseInt(classLevelStr.toString().replace(/\D/g, '')) || 1;
                const availableFormats = getFormatsForLevel(school.types, classLevel, studentData?.section);
                return availableFormats.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ));
              })()}
            </SelectContent>
          </Select>
          <Button onClick={handleDownloadBulletin} className="gap-2">
            <Download className="h-4 w-4" />
            Télécharger Bulletin
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Résumé - Trimestre {trimester}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div>
              <p className="text-sm text-muted-foreground">Moyenne Générale</p>
              <p className="text-4xl font-bold text-primary">{Math.round(average)}/20</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mention</p>
              <div className="mt-1">{getMentionBadge(average)}</div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Matières évaluées</p>
              <p className="text-2xl font-bold">{grades.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grades Table */}
      <Card>
        <CardHeader>
          <CardTitle>Détail des Notes</CardTitle>
          <CardDescription>
            Notes par matière pour le {trimester === "1" ? "1er" : trimester === "2" ? "2ème" : "3ème"} trimestre
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matière</TableHead>
                <TableHead className="text-center">Max Pér.</TableHead>
                <TableHead className="text-center">1ère Pér.</TableHead>
                <TableHead className="text-center">2ème Pér.</TableHead>
                <TableHead className="text-center">Devoir</TableHead>
                <TableHead className="text-center">Examen</TableHead>
                <TableHead className="text-center">Moyenne</TableHead>
                <TableHead>Appréciation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grades.map((grade) => {
                // Populate subject? Backend should populate subjectId
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
                    <TableCell className="text-center">
                      <span className={`font-bold ${(grade.moyenne || 0) >= 14 ? "text-green-600" :
                        (grade.moyenne || 0) >= 10 ? "text-yellow-600" : "text-destructive"
                        }`}>
                        {grade.moyenne ? Math.round(grade.moyenne) : "-"}
                      </span>
                    </TableCell>
                    <TableCell>{grade.appreciation}</TableCell>
                  </TableRow>
                );
              })}
              {grades.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Aucune note disponible pour ce trimestre
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
