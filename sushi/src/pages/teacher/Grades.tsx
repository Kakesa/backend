/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Save, Loader2 } from "lucide-react";
import { apiGetAllClasses } from "@/services/api/classes.api";
import { apiGetTeacherCourses } from "@/services/api/courses.api";
import { apiGetStudentsByClass } from "@/services/api/students.api";
import { apiGetAllGrades, apiBulkCreateGrades, apiGetGradesByStudentAndTrimester, apiGetGradesByStudent } from "@/services/api/grades.api";
import { SmartBulletinEngine } from "@/lib/smartBulletinEngine";
import { bulletinFormats, getFormatsForLevel } from "@/lib/bulletinRegistry";
import { getCurrentSchool } from "@/data/schoolData";
import { apiGetCurrentSchool } from "@/services/api/schools.api";
import { Download } from "lucide-react";
import type { Class, Course, Student, Grade } from "@/types";

interface GradeEntry {
  studentId: string;
  coefficient?: string; // allow per-work coefficient
  interrogation1: string;
  interrogation2: string;
  devoir: string;
  examen: string;
}

export default function TeacherGrades() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [classes, setClasses] = useState<Class[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedTrimester, setSelectedTrimester] = useState<string>("1");
  const [bulletinFormat, setBulletinFormat] = useState<string>("standard");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gradeEntries, setGradeEntries] = useState<Record<string, GradeEntry>>({});

  // modal state for manual coefficient and grade entry
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStudentId, setModalStudentId] = useState<string | null>(null);
  const [modalField, setModalField] = useState<keyof GradeEntry | null>(null);
  const [modalCoeff, setModalCoeff] = useState<string>("");
  const [modalValue, setModalValue] = useState<string>("");

  const currentSchool = getCurrentSchool();

  // 1. Fetch initial data (Classes & Courses)
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user?.linkedId) return;
      try {
        setLoading(true);
        // Fetch courses first to know which classes the teacher teaches
        const coursesData = await apiGetTeacherCourses(user.linkedId);
        setCourses(coursesData);

        // Extract unique classes from courses
        const classIds = Array.from(new Set(coursesData.map(c =>
          (c.classId && typeof c.classId === 'object' && '_id' in c.classId)
            ? c.classId._id
            : (typeof c.classId === 'string' ? c.classId : null)
        ).filter((id): id is string => !!id)));

        // Fetch full class details (or use the one from course if populated)
        // Ideally we should have an API to get classes by teacher, but extracting from courses works
        // We'll fetch all classes and filter, or use what we have. 
        // Let's rely on apiGetAllClasses for now but we might need a better filter.
        // Actually, if coursesData sends full class objects, we can use that.

        const uniqueClasses: Class[] = [];
        const seenIds = new Set();

        coursesData.forEach(c => {
          // c.classId can be a string or an object
          if (typeof c.classId === 'object' && c.classId) {
            const clsObj = c.classId;
            // We rely on the populated object matching the Class structure or at least having _id/name
            // Since we updated types, clsObj has _id.
            const clsId = clsObj._id || (clsObj as any).id;
            if (clsId && !seenIds.has(clsId)) {
              // We need to cast to Class or ensure it matches. 
              // Let's assume the populated object has enough fields to be useful
              // or at least name and id.
              uniqueClasses.push({
                id: clsId,
                name: clsObj.name,
                level: (clsObj as any).level || "",
                section: (clsObj as any).section || "",
                academicYear: (clsObj as any).academicYear || "",
                mainTeacherId: (clsObj as any).mainTeacherId || "",
                studentCount: (clsObj as any).studentCount || 0
              });
              seenIds.add(clsId);
            }
          } else if (typeof c.classId === 'string' && !seenIds.has(c.classId)) {
            // String ID case
          }
        });

        setClasses(uniqueClasses);

        if (uniqueClasses.length > 0) setSelectedClassId(uniqueClasses[0].id);

      } catch (error) {
        console.error("Error fetching teacher data:", error);
        toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les données." });
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [user, toast]);

  // 2. Auto-select course when class changes
  useEffect(() => {
    if (selectedClassId) {
      const classCourses = courses.filter(c =>
        (typeof c.classId === 'object' ? c.classId._id : c.classId) === selectedClassId
      );
      if (classCourses.length > 0) {
        setSelectedCourseId(classCourses[0].id);
      } else {
        setSelectedCourseId("");
      }
    }
  }, [selectedClassId, courses]);

  // Helper to get subject ID
  const getSubjectIdFromCourse = useCallback((courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return "";
    return typeof course.subjectId === 'object' ? course.subjectId._id : course.subjectId;
  }, [courses]);

  // Helper to get coefficient from the selected course's subject
  const getCoefficientFromCourse = useCallback((courseId: string): number => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return currentSchool?.settings?.gradeScale || 20;
    const subj = course.subjectId as any;
    if (subj && typeof subj === 'object' && subj.coefficient != null) {
      return subj.coefficient;
    }
    return currentSchool?.settings?.gradeScale || 20;
  }, [courses, currentSchool]);

  const currentCoefficient = getCoefficientFromCourse(selectedCourseId);

  // 3. Fetch Students and Grades when selection changes
  useEffect(() => {
    const fetchStudentsAndGrades = async () => {
      if (!selectedClassId || !selectedCourseId || !selectedTrimester) return;

      try {
        setLoading(true);
        const [studentsData, gradesData] = await Promise.all([
          apiGetStudentsByClass(selectedClassId),
          apiGetAllGrades({
            classId: selectedClassId,
            subjectId: getSubjectIdFromCourse(selectedCourseId), // We need subjectId, not courseId for grades usually? Model says subjectId.
            trimester: selectedTrimester,
            academicYear: currentSchool?.academicYear || "2024-2025"
          })
        ]);

        setStudents(studentsData);

        // Map grades to entries
        const entries: Record<string, GradeEntry> = {};
        studentsData.forEach(student => {
          const grade = gradesData.find(g => g.studentId === student.id || (g.studentId as any)._id === student.id);
          entries[student.id] = {
            studentId: student.id,
            interrogation1: grade?.interrogation1?.toString() || "",
            interrogation2: grade?.interrogation2?.toString() || "",
            devoir: grade?.devoir?.toString() || "",
            examen: grade?.examen?.toString() || ""
          };
        });
        setGradeEntries(entries);

      } catch (error) {
        console.error("Error fetching students/grades:", error);
        toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les élèves/notes." });
      } finally {
        setLoading(false);
      }
    };

    fetchStudentsAndGrades();
  }, [selectedClassId, selectedCourseId, selectedTrimester, getSubjectIdFromCourse, toast, currentSchool?.academicYear]);

  const openModal = (studentId: string, field: keyof GradeEntry) => {
    const entry = gradeEntries[studentId] || { studentId, interrogation1: '', interrogation2: '', devoir: '', examen: '' } as GradeEntry;
    setModalStudentId(studentId);
    setModalField(field);
    setModalCoeff(entry.coefficient || currentCoefficient.toString());
    setModalValue((entry[field] as string) || "");
    setIsModalOpen(true);
  };

  const handleModalSave = () => {
    if (!modalStudentId || !modalField) return;
    let coeffNum = parseFloat(modalCoeff);
    if (isNaN(coeffNum)) coeffNum = currentCoefficient;
    let valNum = parseFloat(modalValue);
    if (!isNaN(valNum) && coeffNum && valNum > coeffNum) {
      toast({ variant: "destructive", title: "Note trop élevée", description: `La note ne peut pas dépasser le coef ${coeffNum}` });
      valNum = coeffNum;
    }
    setGradeEntries(prev => ({
      ...prev,
      [modalStudentId]: {
        ...prev[modalStudentId],
        studentId: modalStudentId,
        coefficient: coeffNum.toString(),
        [modalField]: valNum.toString(),
      } as any,
    }));
    setIsModalOpen(false);
  };

  const handleGradeChange = (studentId: string, field: keyof GradeEntry, value: string) => {
    // open modal interaction instead of direct edit
    setModalStudentId(studentId);
    setModalField(field);
    const entry = gradeEntries[studentId];
    setModalCoeff(entry?.coefficient || currentCoefficient.toString());
    setModalValue(value);
    setIsModalOpen(true);
  };

  const calculateMoyenne = (entry: GradeEntry): number | null => {
    const int1 = parseFloat(entry.interrogation1);
    const int2 = parseFloat(entry.interrogation2);
    const devoir = parseFloat(entry.devoir);
    const examen = parseFloat(entry.examen);

    // Check if at least one grade is present to calculate average? 
    // Or following specific formula requirements.
    // Let's treat empty as 0 ONLY if at least one other field is filled, or just return null if all empty

    if (isNaN(int1) && isNaN(int2) && isNaN(devoir) && isNaN(examen)) {
      return null;
    }

    const vInt1 = isNaN(int1) ? 0 : int1;
    const vInt2 = isNaN(int2) ? 0 : int2;
    const vDevoir = isNaN(devoir) ? 0 : devoir;
    const vExamen = isNaN(examen) ? 0 : examen;

    // Formula: ((Int1 + Int2)/2 + Devoir + 2*Examen) / 4 ? 
    // Previous formula: ( (Int1 + Int2)/2 * 0.25 ) ... wait, standard is usually:
    // TJ (Travail Journalier) = (I1 + I2 + ... + D) / N
    // Examen
    // Moyenne = (TJ + Examen) / 2  OR (TJ + Examen)/2

    // Let's stick to the previous formula found in code for consistency if valid, or a standard one.
    // Previous: (moyenneInt * 0.25) + (devoir * 0.25) + (examen * 0.5);
    // where moyenneInt = (int1 + int2) / 2

    const moyenneInt = (vInt1 + vInt2) / 2;
    const coeff = entry?.coefficient ? parseFloat(entry.coefficient) : currentCoefficient || 20;
    // ensure grades clamped to coefficient
    const clampVal = (num: number) => (coeff && num > coeff ? coeff : num);
    const mj = clampVal(moyenneInt) * 0.25;
    const md = clampVal(vDevoir) * 0.25;
    const me = clampVal(vExamen) * 0.5;
    const result = mj + md + me;
    return Math.round(result * 100) / 100; // Arrondi à 2 décimales
  };

  const handleSaveGrades = async () => {
    try {
      setSaving(true);
      const subjectId = getSubjectIdFromCourse(selectedCourseId);
      if (!subjectId) return;

      const gradesToSave = Object.values(gradeEntries).map(entry => {
        const moyenne = calculateMoyenne(entry);
        // clamp each field by coefficient as a final safety, use entry.coefficient if provided
        const coeffVal = entry.coefficient ? parseFloat(entry.coefficient) : currentCoefficient || 20;
        const clamp = (val?: string): number | undefined => {
          if (!val) return undefined;
          let num = parseFloat(val);
          if (isNaN(num)) return undefined;
          if (coeffVal && num > coeffVal) num = coeffVal;
          return num;
        };
        return {
          studentId: entry.studentId,
          subjectId: subjectId,
          trimester: parseInt(selectedTrimester) as 1 | 2 | 3,
          academicYear: currentSchool?.academicYear || "2024-2025",
          interrogation1: clamp(entry.interrogation1),
          interrogation2: clamp(entry.interrogation2),
          devoir: clamp(entry.devoir),
          examen: clamp(entry.examen),
          moyenne: moyenne !== null ? moyenne : undefined
        };
      });

      await apiBulkCreateGrades(gradesToSave);

      toast({
        title: "Notes enregistrées",
        description: "Les notes ont été sauvegardées avec succès.",
      });
    } catch (error) {
      console.error("Error saving grades:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'enregistrer les notes.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadStudentBulletin = async (student: Student) => {
    // Try to get school from backend first, fallback to local mock
    let school = currentSchool;
    try {
      const backendSchool = await apiGetCurrentSchool();
      if (backendSchool) school = backendSchool as any;
    } catch { /* fallback to local */ }
    if (!school) return;

    try {
      setLoading(true);
      const allGrades = await apiGetGradesByStudent(student.id);
      const studentGradesToUse = allGrades.map(g => ({
        ...g,
        subjectId: typeof g.subjectId === 'object' ? g.subjectId : g.subjectId
      }));

      // Utiliser le SmartBulletinEngine pour choisir le bon moteur
      await SmartBulletinEngine.generateBulletin({
        student,
        grades: studentGradesToUse,
        subjects: (school as any)?.subjects || [],
        academicYear: school.academicYear,
        schoolName: school.name,
        schoolAddress: school.address,
        schoolCode: school.code,
        nPerm: student.matricule || "N/A",
        province: school.city || "Kinshasa",
        schoolLogo: school.logo,
        layoutType: selectedTrimester === "annual" ? "trimester" : undefined,
      });

      toast({
        title: "Bulletin généré",
        description: `Bulletin de ${student.firstName} téléchargé avec succès.`,
      });
    } catch (error) {
      console.error("Error generating bulletin:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de générer le bulletin",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Paramètres de saisie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Classe</label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Matière</label>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {courses
                    .filter(c => (typeof c.classId === 'object' ? c.classId._id : c.classId) === selectedClassId)
                    .map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {typeof course.subjectId === 'object' ? course.subjectId.name : 'Matière'}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Trimestre</label>
              <Select value={selectedTrimester} onValueChange={setSelectedTrimester}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1er Trimestre</SelectItem>
                  <SelectItem value="2">2ème Trimestre</SelectItem>
                  <SelectItem value="3">3ème Trimestre</SelectItem>
                  <SelectItem value="annual">Récapitulatif Annuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Format Bulletin</label>
              <Select value={bulletinFormat} onValueChange={(v: string) => setBulletinFormat(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Classique</SelectItem>
                  {(() => {
                    const school = getCurrentSchool();
                    if (!school) return null;
                    const selectedCls = classes.find(c => c.id === selectedClassId);
                    const classLevelStr = (selectedCls as any)?.level || "1";
                    const classLevel = parseInt(classLevelStr.toString().replace(/\D/g, '')) || 1;
                    const availableFormats = getFormatsForLevel(school.types, classLevel, (selectedCls as any)?.section);
                    return availableFormats.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau de saisie */}
      {selectedClassId && selectedCourseId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Notes des élèves</CardTitle>
              <CardDescription>
                {(() => {
                  const course = courses.find(c => c.id === selectedCourseId);
                  if (!course?.subjectId) return "Matière inconnue";
                  return typeof course.subjectId === 'object' ? course.subjectId.name : "Matière";
                })()} - {classes.find(c => c.id === selectedClassId)?.name}
              </CardDescription>
            </div>
            <Button onClick={handleSaveGrades} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Enregistrer
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
              <div className="overflow-x-auto">
                <p className="mb-2 text-sm text-muted-foreground">
                  Coefficient du sujet: <strong>{currentCoefficient || 0}</strong>. Les notes saisies ne peuvent pas dépasser ce coefficient.
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Élève</TableHead>
                      <TableHead className="text-center">Coef</TableHead>
                      <TableHead className="text-center">Int. 1</TableHead>
                      <TableHead className="text-center">Int. 2</TableHead>
                      <TableHead className="text-center">Devoir</TableHead>
                      <TableHead className="text-center">Examen</TableHead>
                      <TableHead className="text-center">Moyenne</TableHead>
                      <TableHead className="text-center">Bulletin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => {
                      const entry = gradeEntries[student.id];
                      if (!entry) return null;

                      const moyenne = calculateMoyenne(entry);

                      return (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">
                            {student.lastName} {student.firstName}
                          </TableCell>
                          <TableCell className="text-center">
                            {entry.coefficient || currentCoefficient || "-"}
                          </TableCell>
                          <TableCell className="text-center">
                            <button
                              type="button"
                              className="w-full min-w-[4rem] py-2 rounded-md border border-input bg-background text-center text-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                              onClick={() => openModal(student.id, "interrogation1")}
                            >
                              {entry.interrogation1
                                ? `${entry.interrogation1}/${entry.coefficient || currentCoefficient || 20}`
                                : "—"}
                            </button>
                          </TableCell>
                          <TableCell className="text-center">
                            <button
                              type="button"
                              className="w-full min-w-[4rem] py-2 rounded-md border border-input bg-background text-center text-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                              onClick={() => openModal(student.id, "interrogation2")}
                            >
                              {entry.interrogation2
                                ? `${entry.interrogation2}/${entry.coefficient || currentCoefficient || 20}`
                                : "—"}
                            </button>
                          </TableCell>
                          <TableCell className="text-center">
                            <button
                              type="button"
                              className="w-full min-w-[4rem] py-2 rounded-md border border-input bg-background text-center text-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                              onClick={() => openModal(student.id, "devoir")}
                            >
                              {entry.devoir
                                ? `${entry.devoir}/${entry.coefficient || currentCoefficient || 20}`
                                : "—"}
                            </button>
                          </TableCell>
                          <TableCell className="text-center">
                            <button
                              type="button"
                              className="w-full min-w-[4rem] py-2 rounded-md border border-input bg-background text-center text-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                              onClick={() => openModal(student.id, "examen")}
                            >
                              {entry.examen
                                ? `${entry.examen}/${entry.coefficient || currentCoefficient || 20}`
                                : "—"}
                            </button>
                          </TableCell>
                          <TableCell className="text-center font-bold">
                            {moyenne !== null ? Math.round(moyenne) : "-"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadStudentBulletin(student)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {students.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                          Aucun élève trouvé dans cette classe
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* coefficient/grade entry modal */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Saisie de la note</DialogTitle>
                      <DialogDescription>Entrez la note et le coefficient au format Note/coefficient</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label>Note / Coefficient</Label>
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 w-9 p-0"
                              onClick={() => setModalValue(prev => {
                                const v = parseFloat(String(prev)) || 0;
                                return String(Math.max(0, +(v - 0.5).toFixed(1)));
                              })}
                            >
                              -
                            </Button>
                            <span className="min-w-[3rem] text-center font-medium tabular-nums">
                              {modalValue || "0"}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 w-9 p-0"
                              onClick={() => setModalValue(prev => {
                                const v = parseFloat(String(prev)) || 0;
                                const max = parseFloat(String(modalCoeff)) || 20;
                                return String(Math.min(max, +(v + 0.5).toFixed(1)));
                              })}
                            >
                              +
                            </Button>
                          </div>
                          <span className="text-xl font-bold text-muted-foreground">/</span>
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 w-9 p-0"
                              onClick={() => setModalCoeff(prev => {
                                const v = parseFloat(String(prev)) || 0;
                                return String(Math.max(0.5, +(v - 0.5).toFixed(1)));
                              })}
                            >
                              -
                            </Button>
                            <span className="min-w-[3rem] text-center font-medium tabular-nums">
                              {modalCoeff || "20"}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 w-9 p-0"
                              onClick={() => setModalCoeff(prev => {
                                const v = parseFloat(String(prev)) || 0;
                                return String(Math.min(20, +(v + 0.5).toFixed(1)));
                              })}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          Exemple : 15 / 20
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                      <Button onClick={handleModalSave}>Enregistrer</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
