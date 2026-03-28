import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Eye, FileText } from 'lucide-react';
import { generateBulletinGenericPDF } from '@/lib/bulletinEngine';
import { getFormatsForLevel } from '@/lib/bulletinRegistry';
import type { Student, Grade } from '@/types';

interface BulletinViewerProps {
  students?: Student[];
  grades?: Grade[];
  academicYear?: string;
  schoolName?: string;
  schoolAddress?: string;
  schoolCode?: string;
  nPerm?: string;
  province?: string;
  town?: string;
  commune?: string;
  schoolLogo?: string;
  userRole?: 'parent' | 'student' | 'teacher' | 'admin';
  selectedStudent?: Student;
  onStudentSelect?: (student: Student) => void;
}

const BulletinViewer: React.FC<BulletinViewerProps> = ({
  students = [],
  grades = [],
  academicYear = new Date().getFullYear().toString() + '-' + (new Date().getFullYear() + 1).toString().slice(-2),
  schoolName = 'École',
  schoolAddress = '',
  schoolCode = '',
  nPerm = '',
  province = '',
  town = '',
  commune = '',
  schoolLogo = '',
  userRole = 'parent',
  selectedStudent,
  onStudentSelect,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedTrimester, setSelectedTrimester] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(selectedStudent || null);

  useEffect(() => {
    if (selectedStudent) {
      setCurrentStudent(selectedStudent);
      setSelectedStudentId(selectedStudent.id);
    }
  }, [selectedStudent]);

  const handleStudentChange = (studentId: string) => {
    setSelectedStudentId(studentId);
    const student = students.find(s => s.id === studentId);
    if (student) {
      setCurrentStudent(student);
      onStudentSelect?.(student);
    }
  };

  const generateBulletin = async () => {
    if (!currentStudent) return;

    setIsGenerating(true);
    try {
      const formatConfig = getFormatsForLevel(
        currentStudent.schoolType || 'primary',
        parseInt(currentStudent.class?.toString() || '1'),
        currentStudent.section
      )[0];

      if (!formatConfig) {
        throw new Error('Aucun format de bulletin trouvé pour ce niveau');
      }

      await generateBulletinGenericPDF({
        student: currentStudent,
        grades,
        academicYear,
        schoolName,
        schoolAddress,
        schoolCode,
        nPerm,
        province,
        town,
        commune,
        schoolLogo,
        formatConfig,
      });
    } catch (error) {
      console.error('Erreur lors de la génération du bulletin:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getFilteredGrades = () => {
    if (!currentStudent) return [];
    
    let filtered = grades.filter(grade => 
      typeof grade.studentId === 'string' 
        ? grade.studentId === currentStudent.id
        : grade.studentId.id === currentStudent.id
    );

    if (selectedTrimester !== 'all') {
      filtered = filtered.filter(grade => grade.trimester === parseInt(selectedTrimester));
    }

    return filtered;
  };

  const getStudentStats = () => {
    const filteredGrades = getFilteredGrades();
    if (filteredGrades.length === 0) return null;

    const totalPoints = filteredGrades.reduce((sum, grade) => sum + (grade.moyenne || 0), 0);
    const average = filteredGrades.length > 0 ? totalPoints / filteredGrades.length : 0;

    return {
      totalGrades: filteredGrades.length,
      average: Math.round(average),
      passing: average >= 50
    };
  };

  const stats = getStudentStats();

  return (
    <div className="space-y-6">
      {/* En-tête avec sélections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Bulletin Scolaire
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sélection de l'élève */}
            {(userRole === 'parent' || userRole === 'teacher' || userRole === 'admin') && students.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Sélectionner l'élève</label>
                <Select value={selectedStudentId} onValueChange={handleStudentChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un élève..." />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.firstName} {student.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Sélection du trimestre */}
            <div>
              <label className="text-sm font-medium mb-2 block">Période</label>
              <Select value={selectedTrimester} onValueChange={setSelectedTrimester}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une période..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Année complète</SelectItem>
                  <SelectItem value="1">1er Trimestre</SelectItem>
                  <SelectItem value="2">2ème Trimestre</SelectItem>
                  <SelectItem value="3">3ème Trimestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              onClick={generateBulletin} 
              disabled={!currentStudent || isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Générer le bulletin PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informations de l'élève sélectionné */}
      {currentStudent && (
        <Card>
          <CardHeader>
            <CardTitle>Informations de l'élève</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nom complet</p>
                <p className="font-medium">{currentStudent.firstName} {currentStudent.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Classe</p>
                <p className="font-medium">
                  {typeof currentStudent.class === 'object' ? currentStudent.class?.name : currentStudent.class}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Matricule</p>
                <p className="font-medium">{currentStudent.matricule}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Sexe</p>
                <p className="font-medium">
                  {currentStudent.gender === 'MALE' ? 'Masculin' : 
                   currentStudent.gender === 'FEMALE' ? 'Féminin' : currentStudent.gender}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiques */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Statistiques académiques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.totalGrades}</p>
                <p className="text-sm text-gray-600">Notes enregistrées</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.average}%</p>
                <p className="text-sm text-gray-600">Moyenne générale</p>
              </div>
              <div className="text-center">
                <Badge variant={stats.passing ? "default" : "destructive"} className="text-lg px-4 py-2">
                  {stats.passing ? 'ADMIS' : 'AJOURNE'}
                </Badge>
                <p className="text-sm text-gray-600 mt-1">Statut</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aperçu des notes récentes */}
      {getFilteredGrades().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Notes récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getFilteredGrades().slice(0, 5).map((grade, index) => (
                <div key={index} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <p className="font-medium">
                      {typeof grade.subjectId === 'object' ? grade.subjectId.name : `Matière ${index + 1}`}
                    </p>
                    <p className="text-sm text-gray-600">Trimestre {grade.trimester}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{Math.round(grade.moyenne || 0)}%</p>
                    <p className="text-xs text-gray-600">{grade.appreciation}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BulletinViewer;
