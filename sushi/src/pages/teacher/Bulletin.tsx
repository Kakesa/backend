import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Users, BookOpen } from 'lucide-react';
import BulletinViewer from '@/components/bulletin/BulletinViewer';
import { useAuth } from '@/contexts/AuthContext';
import { apiGetStudentsByClass } from '@/services/api/students.api';
import { apiGetGradesByClass } from '@/services/api/grades.api';
import type { Student, Grade } from '@/types';

const Bulletin: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer les classes du professeur depuis l'utilisateur
      const userClasses = user?.linkedProfile?.classes || [];
      
      if (!userClasses || userClasses.length === 0) {
        setError('Aucune classe assignée');
        return;
      }
      const allStudents: Student[] = [];
      const allGrades: Grade[] = [];

      // Récupérer les étudiants et les notes pour chaque classe
      for (const classItem of userClasses) {
        try {
          // Récupérer les étudiants de la classe
          const studentsResponse = await apiGetStudentsByClass(classItem.id || classItem);
          allStudents.push(...studentsResponse);

          // Récupérer les notes de la classe
          const gradesResponse = await apiGetGradesByClass(classItem.id || classItem);
          allGrades.push(...gradesResponse);
        } catch (err) {
          console.error(`Erreur pour la classe ${classItem.id || classItem}:`, err);
        }
      }

      setStudents(allStudents);
      setGrades(allGrades);

    } catch (err) {
      console.error('Erreur lors de la récupération des données:', err);
      setError('Une erreur est survenue lors du chargement des données');
    } finally {
      setLoading(false);
    }
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

  if (students.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Bulletin Scolaire
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Aucun étudiant n'est trouvé dans vos classes. Veuillez contacter l'administration.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bulletin Scolaire</h1>
        <p className="text-gray-600">
          Générez les bulletins scolaires des étudiants de vos classes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Statistiques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{students.length}</p>
              <p className="text-sm text-gray-600">Étudiants totaux</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{grades.length}</p>
              <p className="text-sm text-gray-600">Notes enregistrées</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {new Set(students.map(s => s.class)).size}
              </p>
              <p className="text-sm text-gray-600">Classes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <BulletinViewer
        students={students}
        grades={grades}
        academicYear={user?.linkedProfile?.academicYear || new Date().getFullYear().toString() + '-' + (new Date().getFullYear() + 1).toString().slice(-2)}
        schoolName={user?.linkedProfile?.schoolName || 'École'}
        schoolAddress={user?.linkedProfile?.schoolAddress || ''}
        schoolCode={user?.linkedProfile?.schoolCode || ''}
        nPerm={user?.linkedProfile?.nPerm || ''}
        province={user?.linkedProfile?.province || ''}
        town={user?.linkedProfile?.town || ''}
        commune={user?.linkedProfile?.commune || ''}
        schoolLogo={user?.linkedProfile?.schoolLogo || ''}
        userRole="teacher"
      />
    </div>
  );
};

export default Bulletin;
