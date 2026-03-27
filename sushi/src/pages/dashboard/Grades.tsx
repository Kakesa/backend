/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Printer, TrendingUp, Building2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateAnnualReportPDF } from "@/lib/bulletinPDF";
import { generateBulletinPDF } from "@/lib/pdfGenerator";
import { generateBulletinGenericPDF } from "@/lib/bulletinEngine";
import { generateAutoCommentedBulletin } from "@/lib/bulletinPDFEnhanced";
import { generatePortraitDRCBulletin } from "@/lib/bulletinPortraitDRC";
import { bulletinFormats, getFormatsForLevel } from "@/lib/bulletinRegistry";
import { apiGetGradesByStudent, apiGetGradesByClass } from "@/services/api/grades.api";
import { apiGetAllClasses } from "@/services/api/classes.api";
import { apiGetStudentsByClass } from "@/services/api/students.api";
import { apiGetAllSubjects } from "@/services/api/subjects.api";
import { apiGetCurrentSchool } from "@/services/api/schools.api";
import { useEffect } from "react";
import type { Class, Student, Subject, Grade, School } from "@/types";

const trimestres = ["1er Trimestre", "2ème Trimestre", "3ème Trimestre", "Rapport Annuel"];

export default function Grades() {
  const [classList, setClassList] = useState<Class[]>([]);
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [subjectList, setSubjectList] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTrimestre, setSelectedTrimestre] = useState<string>("1");
  const [bulletinFormat, setBulletinFormat] = useState<string>("standard");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [currentSchool, setCurrentSchool] = useState<School | null>(null);
  const [stats, setStats] = useState({
    classAverage: "0.00",
    bestAverage: "0.00",
    bestStudentName: "N/A",
    successRate: "0%"
  });
  const { toast } = useToast();

  const calculateMoyenne = (matieres: Record<string, { note: number; coef: number }>) => {
    let totalPoints = 0;
    let totalCoef = 0;
    if (!matieres) return "0.00";
    Object.values(matieres).forEach(({ note, coef }) => {
      totalPoints += note * coef;
      totalCoef += coef;
    });
    return totalCoef > 0 ? (totalPoints / totalCoef).toFixed(2) : "0.00";
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [classes, subjects, school] = await Promise.all([
          apiGetAllClasses(),
          apiGetAllSubjects(),
          apiGetCurrentSchool()
        ]);
        setClassList(classes);
        setSubjectList(subjects);
        setCurrentSchool(school || null);
        if (classes.length > 0) {
          setSelectedClassId(classes[0].id);
        }
      } catch (e) {
        console.error("Error fetching initial data", e);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données initiales.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  useEffect(() => {
    const fetchStudentsAndStats = async () => {
      if (!selectedClassId) return;
      try {
        setLoading(true);
        const [students, classGrades] = await Promise.all([
          apiGetStudentsByClass(selectedClassId),
          apiGetGradesByClass(selectedClassId)
        ]);
        setStudentList(students);

        // Basic stats calculation (can be improved)
        if (classGrades.length > 0) {
          const studentAverages: Record<string, number> = {};
          classGrades.forEach(g => {
            const studentId = typeof g.studentId === 'object' ? (g.studentId._id || g.studentId.id) : g.studentId;
            if (!studentId) return;

            // Very simplified average calculation
            if (!studentAverages[studentId]) studentAverages[studentId] = 0;
            studentAverages[studentId] = g.moyenne || 0; // Use moyenne instead of value
          });

          const averages = Object.values(studentAverages);
          const classAvg = averages.length > 0 ? averages.reduce((a, b) => a + b, 0) / averages.length : 0;
          const bestAvg = averages.length > 0 ? Math.max(...averages) : 0;
          const successCount = averages.filter(a => a >= 10).length;
          const rate = averages.length > 0 ? Math.round((successCount / averages.length) * 100) : 0;

          setStats({
            classAverage: classAvg.toFixed(2),
            bestAverage: bestAvg.toFixed(2),
            bestStudentName: "Voir tableau", // or find student name
            successRate: `${rate}%`
          });
        }
      } catch (e) {
        console.error("Error fetching students and stats", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentsAndStats();
  }, [selectedClassId]);

  const filteredStudents = studentList.filter((s) =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMoyenneStatus = (moyenne: number) => {
    if (moyenne >= 14) return { label: "Excellent", variant: "default" as const };
    if (moyenne >= 12) return { label: "Bien", variant: "secondary" as const };
    if (moyenne >= 10) return { label: "Passable", variant: "outline" as const };
    return { label: "Insuffisant", variant: "destructive" as const };
  };

  const handleGenerateBulletin = async (studentId?: string) => {
    const targetStudentId = studentId || selectedStudentId;
    if (!targetStudentId) return;

    const targetStudent = studentList.find(s => s.id === targetStudentId);

    if (!targetStudent || !currentSchool) {
      toast({
        title: "Erreur",
        description: "Impossible de générer le bulletin. Vérifiez les données.",
        variant: "destructive",
      });
      return;
    }

    const allGrades = await apiGetGradesByStudent(targetStudent.id);
    const grades = allGrades.map(g => ({
      ...g,
      subjectId: subjectList.find(s => s.id === (typeof g.subjectId === 'object' ? g.subjectId._id : g.subjectId)) || g.subjectId
    }));

    try {
      if (bulletinFormat === "portrait-drc-semester" || bulletinFormat === "portrait-drc-trimester") {
        await generatePortraitDRCBulletin({
          student: targetStudent,
          grades,
          subjects: subjectList,
          academicYear: currentSchool.academicYear,
          schoolName: currentSchool.name,
          schoolAddress: currentSchool.address,
          schoolCode: currentSchool.code,
          nPerm: targetStudent.matricule || "N/A",
          province: "Kinshasa",
          schoolLogo: currentSchool.logo,
          layoutType: bulletinFormat === "portrait-drc-trimester" ? "trimester" : "semester",
        });
        toast({
          title: "Bulletin Portrait généré",
          description: `Bulletin officiel de ${targetStudent.firstName} téléchargé.`,
        });
        return;
      }

      if (bulletinFormat !== "standard") {
        const selectedFormat = bulletinFormats.find(f => f.id === bulletinFormat);
        if (!selectedFormat) return;

        await generateBulletinGenericPDF({
          student: targetStudent,
          grades,
          academicYear: currentSchool.academicYear,
          schoolName: currentSchool.name,
          schoolAddress: currentSchool.address,
          schoolCode: currentSchool.code,
          nPerm: "PERM-2024-001",
          province: "Kinshasa",
          schoolLogo: currentSchool.logo,
          formatConfig: selectedFormat
        });
        toast({
          title: "Bulletin généré",
          description: `Bulletin format ${selectedFormat.name} de ${targetStudent.firstName} téléchargé.`,
        });
        return;
      }

      if (selectedTrimestre === "Rapport Annuel") {
        await generatePortraitDRCBulletin({
          student: targetStudent,
          grades,
          subjects: subjectList,
          academicYear: currentSchool.academicYear,
          schoolName: currentSchool.name,
          schoolAddress: currentSchool.address,
          schoolCode: currentSchool.code,
          nPerm: targetStudent.matricule || "N/A",
          province: "Kinshasa",
          schoolLogo: currentSchool.logo,
        });
        toast({
          title: "Bulletin Portrait (Annuel) généré",
          description: `Rapport annuel de ${targetStudent.firstName} téléchargé.`,
        });
        return;
      }
      // Utilise le nouveau générateur avec commentaires personnalisés
      const trimesterNumber = selectedTrimestre === "1er Trimestre" ? 1 : selectedTrimestre === "2ème Trimestre" ? 2 : 3;
      await generateAutoCommentedBulletin(
        targetStudent,
        grades,
        trimesterNumber as 1 | 2 | 3,
        currentSchool.academicYear,
        currentSchool.name,
        currentSchool.logo
      );
      toast({
        title: "Bulletin généré avec commentaires",
        description: `Bulletin personnalisé de ${targetStudent.firstName} ${targetStudent.lastName} téléchargé.`,
      });
    } catch (error: any) {
    console.error("Bulletin Generation Error:", error);
    toast({
      title: "Erreur",
      description: `Erreur lors de la génération du PDF : ${error.message || "Erreur inconnue"}`,
      variant: "destructive",
    });
  }
};

const handlePrint = () => {
  window.print();
  toast({
    title: "Impression",
    description: "Envoi vers l'imprimante...",
  });
};

const selectedClassObj = classList.find(c => c.id === selectedClassId);

return (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Bulletins & Notes</h1>
        <p className="text-muted-foreground">Gérez les notes et générez les bulletins</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimer
        </Button>
        <Button onClick={() => handleGenerateBulletin()}>
          <Download className="mr-2 h-4 w-4" />
          {selectedTrimestre === "Rapport Annuel" ? "Générer rapport annuel" : "Générer les bulletins"}
        </Button>
      </div>
    </div>

    {/* École actuelle */}
    {currentSchool && (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-lg">{currentSchool.name}</p>
            <p className="text-sm text-muted-foreground">
              Code: {currentSchool.code} | Année: {currentSchool.academicYear}
            </p>
          </div>
        </CardContent>
      </Card>
    )}

    {/* Filters */}
    <div className="flex flex-wrap gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Classe</label>
        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Choisir une classe" />
          </SelectTrigger>
          <SelectContent>
            {classList.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Trimestre</label>
        <Select value={selectedTrimestre} onValueChange={setSelectedTrimestre}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {trimestres.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Format de Bulletin</label>
        <Select
          value={bulletinFormat}
          onValueChange={(v: string) => setBulletinFormat(v)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">Format Classique</SelectItem>
            {(() => {
              if (!selectedClassObj) {
                console.warn('Missing selectedClassObj');
                return null;
              }
              
              if (!currentSchool) {
                console.warn('Missing currentSchool - data not loaded yet');
                return null;
              }
              
              if (!currentSchool.types) {
                console.warn('Missing currentSchool.types');
                return null;
              }
              
              const classLevelStr = selectedClassObj.level || "1";
              const classLevel = parseInt(classLevelStr.replace(/\D/g, '')) || 1;
              const availableFormats = getFormatsForLevel(currentSchool.types, classLevel, selectedClassObj.section);
              return availableFormats.map(f => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ));
            })()}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Rechercher</label>
        <Input
          placeholder="Nom de l'élève..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-[200px]"
        />
      </div>
    </div>

    {/* Stats */}
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Moyenne de classe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{stats.classAverage}</span>
            <div className="flex items-center text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Global</span>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Meilleure moyenne
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.bestAverage}</div>
          <p className="text-sm text-muted-foreground">{stats.bestStudentName}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Taux de réussite
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.successRate}</div>
          <p className="text-sm text-muted-foreground">Moyenne ≥ 10</p>
        </CardContent>
      </Card>
    </div>

    {/* Grades Table */}
    <Card>
      <CardHeader>
        <CardTitle>Notes - {selectedClassObj?.name || "Classe"} - {selectedTrimestre}</CardTitle>
        <CardDescription>
          Consultez les moyennes et générez les bulletins
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card">Élève</TableHead>
                <TableHead className="text-center">Matricule</TableHead>
                <TableHead className="text-center">Classe</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead className="text-center">Bulletin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    <p className="mt-2 text-muted-foreground">Chargement des élèves...</p>
                  </TableCell>
                </TableRow>
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucun élève trouvé dans cette classe.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => {
                  // In a real app, we might want to pre-calculate or fetch averages
                  // For now, let's show student info and bulletin actions
                  return (
                    <TableRow
                      key={student.id}
                      className={`cursor-pointer ${selectedStudentId === student.id ? "bg-primary/10" : ""}`}
                      onClick={() => setSelectedStudentId(student.id)}
                    >
                      <TableCell className="sticky left-0 bg-card font-medium">
                        {student.firstName} {student.lastName}
                      </TableCell>
                      <TableCell className="text-center">
                        {student.matricule || `STD-2026-${String(student.id || '000').padStart(3, '0')}`}
                      </TableCell>
                      <TableCell className="text-center">
                        {selectedClassObj?.name}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">En cours</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerateBulletin(student.id);
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    {/* Individual Bulletin Preview */}
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Aperçu du bulletin</CardTitle>
            <CardDescription>Sélectionnez un élève pour voir son bulletin</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border p-6">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold">{currentSchool?.name || "BULLETIN SCOLAIRE"}</h2>
            <p className="text-sm text-muted-foreground">{currentSchool?.address}</p>
            <p className="text-muted-foreground mt-2">{selectedTrimestre} - Année {currentSchool?.academicYear || "2024-2025"}</p>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><span className="font-medium">Élève:</span> {selectedStudentId ? `${studentList.find(s => s.id === selectedStudentId)?.firstName} ${studentList.find(s => s.id === selectedStudentId)?.lastName}` : "Sélectionnez un élève"}</p>
              <p><span className="font-medium">Classe:</span> {selectedClassObj?.name || "N/A"}</p>
            </div>
            <div>
              <p><span className="font-medium">Matricule:</span> {selectedStudentId || "N/A"}</p>
              <p><span className="font-medium">Rang:</span> -- / --</p>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matière</TableHead>
                <TableHead className="text-center">Note</TableHead>
                <TableHead className="text-center">Coef.</TableHead>
                <TableHead className="text-center">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                  Générez le bulletin PDF pour voir le détail complet des notes.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div className="mt-4 rounded-lg bg-muted/50 p-4">
            <p className="font-medium">Appréciation du conseil de classe:</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Excellent trimestre. Continue ainsi. Félicitations !
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);
}
