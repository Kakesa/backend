/* eslint-disable @typescript-eslint/no-explicit-any */
import { generatePortraitDRCBulletin } from "@/lib/bulletinPortraitDRC";
import type { Student, Grade, Subject } from "@/types";

// Exemple d'utilisation pour générer un bulletin avec les infos de l'école dynamiques
export const generateBulletinExample = async () => {
    // Données de l'élève (normalement récupérées depuis votre API)
    const student: Student = {
        id: "student-123",
        firstName: "Jean",
        lastName: "Pierre",
        gender: "MALE",
        dateOfBirth: "2010-05-15",
        placeOfBirth: "Kinshasa",
        class: { id: "class-123", name: "6ème Primaire" },
        matricule: "2024-001"
    };

    // Notes de l'élève (normalement récupérées depuis votre API)
    const grades: Grade[] = [
        {
            id: "grade-1",
            studentId: "student-123",
            subjectId: { id: "subject-1", name: "Français", coefficient: 20, domaine: "LANGUES" },
            trimester: 1,
            interrogation1: 15,
            interrogation2: 16,
            devoir: 17,
            examen: 18, // Sera multiplié par 2 dans le calcul (36 points)
            moyenne: 16.5
        },
        {
            id: "grade-2",
            studentId: "student-123",
            subjectId: { id: "subject-2", name: "Mathématiques", coefficient: 20, domaine: "SCIENCES" },
            trimester: 1,
            interrogation1: 14,
            interrogation2: 15,
            devoir: 16,
            examen: 17, // Sera multiplié par 2 dans le calcul (34 points)
            moyenne: 15.5
        }
    ];

    // Matières (normalement récupérées depuis votre API)
    const subjects: Subject[] = [
        { id: "subject-1", name: "Français", coefficient: 20, domaine: "LANGUES" },
        { id: "subject-2", name: "Mathématiques", coefficient: 20, domaine: "SCIENCES" }
    ];

    // Les infos de l'école seront récupérées automatiquement depuis l'API
    // Pas besoin de les fournir manuellement
    const bulletinData = {
        student,
        grades,
        subjects,
        academicYear: "2024-2025",
        // Ces champs sont optionnels maintenant - l'API les récupérera automatiquement
        schoolName: "École Primaire Exemple", // Fallback si l'API échoue
        schoolCode: "EPE001", // Fallback si l'API échoue
        province: "KINSHASA", // Fallback si l'API échoue
        layoutType: "trimester" as const // ou "semester"
    };

    try {
        // La fonction va automatiquement récupérer les infos de l'école depuis l'API
        await generatePortraitDRCBulletin(bulletinData);
        console.log("Bulletin généré avec succès !");
    } catch (error) {
        console.error("Erreur lors de la génération du bulletin:", error);
    }
};

// Utilisation dans un composant React
export const BulletinGeneratorComponent = () => {
    const handleGenerateBulletin = async () => {
        // Récupérer les données depuis vos API
        const studentData = await fetchStudentData();
        const gradesData = await fetchGradesData();
        const subjectsData = await fetchSubjectsData();

        const bulletinData = {
            student: studentData,
            grades: gradesData,
            subjects: subjectsData,
            academicYear: "2024-2025",
            layoutType: "trimester" as const
        };

        await generatePortraitDRCBulletin(bulletinData);
    };

    return (
        <button onClick={handleGenerateBulletin}>
            Générer le bulletin
        </button>
    );
};

// Fonctions d'exemple pour récupérer les données
const fetchStudentData = async (): Promise<Student> => {
    // Implémentez votre appel API ici
    const response = await fetch('/api/students/current');
    return response.json();
};

const fetchGradesData = async (): Promise<Grade[]> => {
    // Implémentez votre appel API ici
    const response = await fetch('/api/grades/student/current');
    return response.json();
};

const fetchSubjectsData = async (): Promise<Subject[]> => {
    // Implémentez votre appel API ici
    const response = await fetch('/api/subjects');
    return response.json();
};
