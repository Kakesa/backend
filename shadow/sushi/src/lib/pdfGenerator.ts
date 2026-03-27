/* eslint-disable @typescript-eslint/no-explicit-any */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Student, Grade } from "@/types";

interface BulletinData {
  student: any;
  grades: any[];
  trimester: 1 | 2 | 3;
  academicYear: string;
  schoolName: string;
  schoolAddress: string;
}

export const generateBulletinPDF = async (
  data: BulletinData,
): Promise<void> => {
  const {
    student,
    grades,
    trimester,
    academicYear,
    schoolName,
    schoolAddress,
  } = data;

  // Handle populated class
  const className =
    typeof student.class === "object" && student.class
      ? student.class.name
      : "N/A";
  const studentCount =
    typeof student.class === "object" &&
    student.class &&
    student.class.studentCount
      ? student.class.studentCount
      : "N/A";

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // En-tête
  doc.setFillColor(41, 128, 185);
  doc.rect(0, 0, pageWidth, 45, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(schoolName, pageWidth / 2, 15, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(schoolAddress, pageWidth / 2, 22, { align: "center" });

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(
    `BULLETIN DE NOTES - ${getTrimesterName(trimester)}`,
    pageWidth / 2,
    35,
    { align: "center" },
  );

  doc.setFontSize(10);
  doc.text(`Année scolaire: ${academicYear}`, pageWidth / 2, 42, {
    align: "center",
  });

  // Informations élève
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("INFORMATIONS DE L'ÉLÈVE", 14, 55);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const infoY = 62;
  const lastName = (student.lastName || "").toUpperCase();
  const firstName = student.firstName || "";
  doc.text(`Nom et Prénom: ${lastName} ${firstName}`, 14, infoY);
  doc.text(`Matricule: ${student.matricule || "N/A"}`, 14, infoY + 6);
  doc.text(`Classe: ${className}`, 14, infoY + 12);

  let birthInfo = "N/A";
  if (student.dateOfBirth) {
    try {
      birthInfo = formatDate(student.dateOfBirth);
    } catch (e) {
      console.warn("Invalid date in pdfGenerator:", student.dateOfBirth);
    }
  }
  doc.text(`Date de naissance: ${birthInfo}`, 110, infoY);
  doc.text(`Effectif: ${studentCount} élèves`, 110, infoY + 6);

  // Tableau des notes
  const tableData: (string | number)[][] = [];
  let totalPoints = 0;
  let totalCoeff = 0;

  grades.forEach((grade) => {
    // Expect subjectId to be populated
    const subject =
      typeof grade.subjectId === "object" ? grade.subjectId : null;

    if (subject && grade.moyenne !== null && grade.moyenne !== undefined) {
      const points = grade.moyenne * subject.coefficient;
      totalPoints += points;
      totalCoeff += subject.coefficient;

      tableData.push([
        subject.name,
        subject.coefficient.toString(),
        grade.interrogation1?.toString() || "-",
        grade.interrogation2?.toString() || "-",
        grade.devoir?.toString() || "-",
        grade.examen?.toString() || "-",
        grade.moyenne.toFixed(2),
        points.toFixed(2),
        grade.appreciation || "",
      ]);
    }
  });

  const moyenne = totalCoeff > 0 ? totalPoints / totalCoeff : 0;

  autoTable(doc, {
    startY: 85,
    head: [
      [
        "Matière",
        "Coef.",
        "Int.1",
        "Int.2",
        "Devoir",
        "Examen",
        "Moy.",
        "Points",
        "Appréciation",
      ],
    ],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      halign: "center",
      fontSize: 9,
    },
    columnStyles: {
      0: { halign: "left", cellWidth: 40 },
      8: { halign: "left", cellWidth: 30 },
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  // Résumé
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFillColor(240, 240, 240);
  doc.rect(14, finalY, pageWidth - 28, 30, "F");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("RÉSUMÉ", 20, finalY + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Total des coefficients: ${totalCoeff}`, 20, finalY + 16);
  doc.text(`Total des points: ${totalPoints.toFixed(2)}`, 20, finalY + 23);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`Moyenne générale: ${moyenne.toFixed(2)}/20`, 110, finalY + 16);

  doc.setFontSize(12);
  const mention = getMention(moyenne);
  doc.setTextColor(mention.color.r, mention.color.g, mention.color.b);
  doc.text(`Mention: ${mention.text}`, 110, finalY + 25);

  // Décision
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  const decisionY = finalY + 40;
  doc.setFont("helvetica", "bold");
  doc.text("Décision du conseil de classe:", 14, decisionY);
  doc.setFont("helvetica", "normal");
  doc.text(
    moyenne >= 10 ? "Admis(e) en classe supérieure" : "Redoublement",
    70,
    decisionY,
  );

  // Signature
  const signatureY = decisionY + 15;
  doc.text(
    `Fait à Kinshasa, le ${formatDate(new Date().toISOString().split("T")[0])}`,
    14,
    signatureY,
  );
  doc.text("Le Chef d'établissement", 130, signatureY);
  doc.line(130, signatureY + 15, 185, signatureY + 15);

  // Pied de page
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(
    "Ce bulletin est un document officiel. Toute falsification est passible de poursuites.",
    pageWidth / 2,
    285,
    { align: "center" },
  );

  // Télécharger
  const safeSchoolName = (schoolName || "Ecole").replace(/\s+/g, "_");
  const safeYear = (academicYear || "2024-2025").replace(/\//g, "-");
  doc.save(
    `Bulletin_${safeSchoolName}_${lastName}_${firstName}_T${trimester}_${safeYear}.pdf`,
  );
};

const getTrimesterName = (trimester: 1 | 2 | 3): string => {
  const names = {
    1: "1er Trimestre",
    2: "2ème Trimestre",
    3: "3ème Trimestre",
  };
  return names[trimester];
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const getMention = (
  moyenne: number,
): { text: string; color: { r: number; g: number; b: number } } => {
  if (moyenne >= 16)
    return { text: "Très Bien", color: { r: 39, g: 174, b: 96 } };
  if (moyenne >= 14) return { text: "Bien", color: { r: 41, g: 128, b: 185 } };
  if (moyenne >= 12)
    return { text: "Assez Bien", color: { r: 243, g: 156, b: 18 } };
  if (moyenne >= 10)
    return { text: "Passable", color: { r: 230, g: 126, b: 34 } };
  return { text: "Insuffisant", color: { r: 231, g: 76, b: 60 } };
};

// Export de la liste de classe
export const generateClassListPDF = async (
  className: string,
  students: Student[],
): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`Liste des élèves - ${className}`, pageWidth / 2, 20, {
    align: "center",
  });

  const tableData = students.map((student, index) => [
    (index + 1).toString(),
    student.matricule,
    `${student.lastName} ${student.firstName}`,
    student.gender === "MALE"
      ? "Masculin"
      : student.gender === "FEMALE"
        ? "Féminin"
        : "Autre",
    formatDate(student.dateOfBirth),
    student.phone,
  ]);

  autoTable(doc, {
    startY: 30,
    head: [
      [
        "N°",
        "Matricule",
        "Nom et Prénom",
        "Genre",
        "Date de naissance",
        "Téléphone",
      ],
    ],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: [255, 255, 255],
    },
  });

  doc.save(`Liste_${className.replace(/\s/g, "_")}.pdf`);
};
