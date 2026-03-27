import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, FileText } from 'lucide-react';
import BulletinViewer from '@/components/bulletin/BulletinViewer';
import { useAuth } from '@/contexts/AuthContext';
import { apiGetGradesByStudent } from '@/services/api/grades.api';
import type { Student, Grade } from '@/types';

const Bulletin: React.FC = () => {
  const { user } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiGetGradesByStudent(user?.id || '');
      
      setGrades(response);
    } catch (err) {
      console.error('Erreur lors de la récupération des notes:', err);
      setError('Une erreur est survenue lors du chargement de vos notes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Chargement de vos notes...</span>
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

  // Créer un objet Student à partir des données de l'utilisateur
  const currentStudent: Student = {
    id: user?.id || '',
    matricule: user?.linkedProfile?.matricule || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.linkedProfile?.phone || '',
    dateOfBirth: user?.linkedProfile?.dateOfBirth || '',
    gender: user?.linkedProfile?.gender || 'MALE',
    address: user?.linkedProfile?.address || '',
    classId: user?.linkedProfile?.classId || '',
    class: user?.linkedProfile?.class || '',
    parentName: user?.linkedProfile?.parentName || '',
    parentPhone: user?.linkedProfile?.parentPhone || '',
    enrollmentDate: user?.linkedProfile?.enrollmentDate || new Date().toISOString(),
    status: 'ACTIVE',
    schoolId: user?.schoolId || '',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mon Bulletin Scolaire</h1>
        <p className="text-gray-600">
          Consultez et téléchargez votre bulletin scolaire
        </p>
      </div>

      <BulletinViewer
        students={[currentStudent]}
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
        userRole="student"
        selectedStudent={currentStudent}
      />
    </div>
  );
};

export default Bulletin;
