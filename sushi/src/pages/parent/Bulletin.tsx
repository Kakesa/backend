import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Users } from 'lucide-react';
import BulletinViewer from '@/components/bulletin/BulletinViewer';
import { useAuth } from '@/contexts/AuthContext';
import { apiGetAllStudents } from '@/services/api/students.api';
import { apiGetAllGrades } from '@/services/api/grades.api';
import type { Student, Grade } from '@/types';

const Bulletin: React.FC = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChildrenData();
  }, []);

  const fetchChildrenData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer tous les étudiants et les notes
      const [studentsResponse, gradesResponse] = await Promise.all([
        apiGetAllStudents(),
        apiGetAllGrades()
      ]);
      
      // Filtrer pour ne garder que les enfants du parent (si l'info est disponible)
      const parentChildrenIds = user?.linkedProfile?.children || [];
      const filteredStudents = parentChildrenIds.length > 0 
        ? studentsResponse.filter(student => parentChildrenIds.includes(student.id))
        : studentsResponse;
      
      setChildren(filteredStudents);
      setGrades(gradesResponse);
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

  if (children.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Bulletin Scolaire
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Aucun enfant n'est associé à votre compte. Veuillez contacter l'administration de l'école.
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
          Consultez et téléchargez les bulletins scolaires de vos enfants
        </p>
      </div>

      <BulletinViewer
        students={children}
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
        userRole="parent"
      />
    </div>
  );
};

export default Bulletin;
