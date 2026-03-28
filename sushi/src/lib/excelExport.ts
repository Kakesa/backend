/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from 'xlsx';

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

export const exportToExcel = (
  data: any[],
  columns: ExportColumn[],
  filename: string,
  sheetName: string = 'Données'
) => {
  // Préparer les données avec les en-têtes
  const headers = columns.map(col => col.header);
  const rows = data.map(item => 
    columns.map(col => {
      const value = item[col.key];
      // Gérer les valeurs imbriquées (ex: student.firstName)
      if (col.key.includes('.')) {
        const keys = col.key.split('.');
        let val = item;
        for (const k of keys) {
          val = val?.[k];
        }
        return val ?? '';
      }
      return value ?? '';
    })
  );

  // Créer le workbook et worksheet
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  
  // Appliquer les largeurs de colonnes
  worksheet['!cols'] = columns.map(col => ({ wch: col.width || 15 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Télécharger le fichier
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

// Export des notes
export const exportGrades = (grades: any[], students: any[], subjects: any[]) => {
  const data = grades.map(grade => {
    const student = students.find(s => s.id === grade.studentId);
    const subject = subjects.find(s => s.id === grade.subjectId);
    return {
      studentName: `${student?.lastName || ''} ${student?.firstName || ''}`,
      studentMatricule: student?.matricule || '',
      subjectName: subject?.name || '',
      trimester: `Trimestre ${grade.trimester}`,
      interrogation1: grade.interrogation1 || '-',
      interrogation2: grade.interrogation2 || '-',
      devoir: grade.devoir || '-',
      examen: grade.examen || '-',
      moyenne: grade.moyenne?.toFixed(2) || '-',
      appreciation: grade.appreciation || '',
    };
  });

  const columns: ExportColumn[] = [
    { header: 'Élève', key: 'studentName', width: 25 },
    { header: 'Matricule', key: 'studentMatricule', width: 15 },
    { header: 'Matière', key: 'subjectName', width: 20 },
    { header: 'Trimestre', key: 'trimester', width: 12 },
    { header: 'Interro 1', key: 'interrogation1', width: 10 },
    { header: 'Interro 2', key: 'interrogation2', width: 10 },
    { header: 'Devoir', key: 'devoir', width: 10 },
    { header: 'Examen', key: 'examen', width: 10 },
    { header: 'Moyenne', key: 'moyenne', width: 10 },
    { header: 'Appréciation', key: 'appreciation', width: 30 },
  ];

  exportToExcel(data, columns, `notes_${new Date().toISOString().split('T')[0]}`, 'Notes');
};

// Export des présences
export const exportAttendance = (attendances: any[], students: any[]) => {
  const data = attendances.map(att => {
    const student = students.find(s => s.id === att.studentId);
    const statusLabels: Record<string, string> = {
      present: 'Présent',
      absent: 'Absent',
      late: 'En retard',
      excused: 'Excusé',
    };
    return {
      studentName: `${student?.lastName || ''} ${student?.firstName || ''}`,
      studentMatricule: student?.matricule || '',
      date: att.date,
      status: statusLabels[att.status] || att.status,
      scanTime: att.scanTime || '-',
      notes: att.notes || '',
    };
  });

  const columns: ExportColumn[] = [
    { header: 'Élève', key: 'studentName', width: 25 },
    { header: 'Matricule', key: 'studentMatricule', width: 15 },
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Statut', key: 'status', width: 12 },
    { header: 'Heure scan', key: 'scanTime', width: 12 },
    { header: 'Notes', key: 'notes', width: 30 },
  ];

  exportToExcel(data, columns, `presences_${new Date().toISOString().split('T')[0]}`, 'Présences');
};

// Export des statistiques par classe
export const exportClassStatistics = (
  classes: any[],
  students: any[],
  grades: any[],
  attendances: any[]
) => {
  const data = classes.map(cls => {
    const classStudents = students.filter(s => s.classId === cls.id);
    const classGrades = grades.filter(g => 
      classStudents.some(s => s.id === g.studentId)
    );
    const classAttendances = attendances.filter(a => 
      classStudents.some(s => s.id === a.studentId)
    );

    const avgGrade = classGrades.length > 0
      ? classGrades.reduce((sum, g) => sum + (g.moyenne || 0), 0) / classGrades.length
      : 0;

    const presentCount = classAttendances.filter(a => a.status === 'present').length;
    const attendanceRate = classAttendances.length > 0
      ? (presentCount / classAttendances.length) * 100
      : 100;

    return {
      className: cls.name,
      level: cls.level,
      studentCount: classStudents.length,
      averageGrade: avgGrade.toFixed(2),
      attendanceRate: `${attendanceRate.toFixed(1)}%`,
      passRate: classGrades.length > 0
        ? `${((classGrades.filter(g => (g.moyenne || 0) >= 10).length / classGrades.length) * 100).toFixed(1)}%`
        : '-',
    };
  });

  const columns: ExportColumn[] = [
    { header: 'Classe', key: 'className', width: 15 },
    { header: 'Niveau', key: 'level', width: 15 },
    { header: 'Effectif', key: 'studentCount', width: 10 },
    { header: 'Moyenne', key: 'averageGrade', width: 12 },
    { header: 'Taux présence', key: 'attendanceRate', width: 15 },
    { header: 'Taux réussite', key: 'passRate', width: 15 },
  ];

  exportToExcel(data, columns, `statistiques_${new Date().toISOString().split('T')[0]}`, 'Statistiques');
};

// Export liste des élèves
export const exportStudents = (students: any[], classes: any[]) => {
  const data = students.map(student => {
    const cls = classes.find(c => c.id === student.classId);
    return {
      matricule: student.matricule,
      lastName: student.lastName,
      firstName: student.firstName,
      email: student.email || '-',
      phone: student.phone || '-',
      className: cls?.name || '-',
      dateOfBirth: student.dateOfBirth || '-',
      gender: student.gender === 'M' ? 'Masculin' : 'Féminin',
      status: student.status === 'active' ? 'Actif' : 'Inactif',
    };
  });

  const columns: ExportColumn[] = [
    { header: 'Matricule', key: 'matricule', width: 15 },
    { header: 'Nom', key: 'lastName', width: 20 },
    { header: 'Prénom', key: 'firstName', width: 20 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Téléphone', key: 'phone', width: 15 },
    { header: 'Classe', key: 'className', width: 12 },
    { header: 'Date de naissance', key: 'dateOfBirth', width: 15 },
    { header: 'Genre', key: 'gender', width: 10 },
    { header: 'Statut', key: 'status', width: 10 },
  ];

  exportToExcel(data, columns, `eleves_${new Date().toISOString().split('T')[0]}`, 'Élèves');
};
