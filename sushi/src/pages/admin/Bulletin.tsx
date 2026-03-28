import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Users, School, BookOpen } from 'lucide-react';
import BulletinViewer from '@/components/bulletin/BulletinViewer';
import { useAuth } from '@/contexts/AuthContext';
import { apiGetAllStudents } from '@/services/api/students.api';
import { apiGetAllGrades } from '@/services/api/grades.api';
import type { Student, Grade } from '@/types';

const Bulletin: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [selectedClass, students]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer toutes les données en parallèle
      const [studentsResponse, gradesResponse] = await Promise.all([
        apiGetAllStudents(),
        apiGetAllGrades()
      ]);

      setStudents(studentsResponse);
      setGrades(gradesResponse);

      // Récupérer les classes depuis l'utilisateur ou utiliser une liste vide
      const userClasses = user?.linkedProfile?.classes || [];
      setClasses(userClasses);

    } catch (err) {
      console.error('Erreur lors de la récupération des données:', err);
      setError('Une erreur est survenue lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    if (selectedClass === 'all') {
      // Tous les étudiants sont déjà chargés
      return;
    }
    
    // Filtrer les étudiants par classe si nécessaire
    // Cette logique peut être étendue selon les besoins
  };

  const getFilteredStudents = () => {
    if (selectedClass === 'all') {
      return students;
    }
    return students.filter(student => 
      typeof student.class === 'object' 
        ? student.class._id === selectedClass
        : student.class === selectedClass
    );
  };

  const getFilteredGrades = () => {
    if (selectedClass === 'all') {
      return grades;
    }
    
    const filteredStudentIds = getFilteredStudents().map(s => s.id);
    return grades.filter(grade => 
      typeof grade.studentId === 'string'
        ? filteredStudentIds.includes(grade.studentId)
        : filteredStudentIds.includes(grade.studentId.id || grade.studentId._id)
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Chargement des données...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const filteredStudents = getFilteredStudents();
  const filteredGrades = getFilteredGrades();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bulletin Scolaire</h1>
        <p className="text-gray-600">
          Générez les bulletins scolaires pour tous les étudiants de l'école
        </p>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="w-5 h-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Filtrer par classe</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une classe..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les classes</SelectItem>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Statistiques de l'école
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{filteredStudents.length}</p>
              <p className="text-sm text-gray-600">Étudiants</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{filteredGrades.length}</p>
              <p className="text-sm text-gray-600">Notes enregistrées</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{classes.length}</p>
              <p className="text-sm text-gray-600">Classes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {new Set(filteredStudents.map(s => 
                  typeof s.class === 'object' ? s.class.name : s.class
                )).size}
              </p>
              <p className="text-sm text-gray-600">Classes uniques</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulletin Viewer */}
      <BulletinViewer
        students={filteredStudents}
        grades={filteredGrades}
        academicYear={user?.linkedProfile?.academicYear || new Date().getFullYear().toString() + '-' + (new Date().getFullYear() + 1).toString().slice(-2)}
        schoolName={user?.linkedProfile?.schoolName || 'École'}
        schoolAddress={user?.linkedProfile?.schoolAddress || ''}
        schoolCode={user?.linkedProfile?.schoolCode || ''}
        nPerm={user?.linkedProfile?.nPerm || ''}
        province={user?.linkedProfile?.province || ''}
        town={user?.linkedProfile?.town || ''}
        commune={user?.linkedProfile?.commune || ''}
        schoolLogo={user?.linkedProfile?.schoolLogo || ''}
        userRole="admin"
      />
    </div>
  );
};

export default Bulletin;
