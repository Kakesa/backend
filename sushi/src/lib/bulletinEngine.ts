/* eslint-disable @typescript-eslint/no-explicit-any */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BulletinFormatConfig } from "./bulletinRegistry";
import type { Student, Grade } from "@/types";

// Extend jsPDF type to include autoTable properties
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

export interface BulletinGenericData {
  student: Student;
  grades: Grade[];
  academicYear: string;
  schoolName: string;
  schoolAddress: string;
  schoolCode: string;
  nPerm: string;
  province: string;
  town?: string; // town/village
  commune?: string; // commune/territory
  schoolLogo?: string;
  formatConfig: BulletinFormatConfig;
}

const loadImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

const drawPlaceholderLogo = (doc: jsPDF): void => {
  doc.setDrawColor(150);
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(10, 5, 25, 25, 2, 2, "FD");
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("LOGO", 22.5, 18, { align: "center" });
  doc.setTextColor(0);
};

export const generateBulletinGenericPDF = async (
  data: BulletinGenericData,
): Promise<void> => {
  const {
    student,
    grades,
    academicYear,
    schoolName,
    schoolCode,
    nPerm,
    schoolLogo,
    province,
    town = "Non spécifié",
    commune = "Non spécifié",
    formatConfig,
  } = data;

  console.log(
    "Generating bulletin for format:",
    formatConfig?.id,
    "Student:",
    student?.id,
  );

  if (!student) {
    console.error("No student data provided");
    throw new Error("Données de l'élève manquantes");
  }

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  }) as jsPDFWithAutoTable;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header Region
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("REPUBLIQUE DEMOCRATIQUE DU CONGO", 10, 10);
  doc.text("MINISTERE DE L'ENSEIGNEMENT PRIMAIRE,", 10, 14);
  doc.text(
    formatConfig.schoolType === "primary"
      ? "SECONDAIRE ET TECHNIQUE"
      : "TECHNIQUE ET PROFESSIONNEL",
    10,
    18,
  );

  doc.setFont("helvetica", "normal");
  doc.text(`Province : ${province}`, 10, 24);
  doc.text(`Ville/Village : ${town}`, 10, 28);
  doc.text(`Commune/Territoire : ${commune}`, 10, 32);

  // Prominent School Name in Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(schoolName.toUpperCase(), pageWidth / 2, 12, { align: "center" });

  if (schoolLogo) {
    try {
      const logoData = schoolLogo.startsWith("data:")
        ? schoolLogo
        : await loadImageAsBase64(schoolLogo);
      if (logoData)
        doc.addImage(logoData, "PNG", pageWidth / 2 - 15, 5, 30, 30);
      else drawPlaceholderLogo(doc);
    } catch {
      drawPlaceholderLogo(doc);
    }
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("BULLETIN DE L'ELEVE", pageWidth - 80, 15);
  doc.setFontSize(10);
  doc.text(`ANNEE SCOLAIRE ${academicYear}`, pageWidth - 80, 22);
  doc.text(formatConfig.name.toUpperCase(), pageWidth - 80, 28);

  // Student Info
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`ECOLE : ${schoolName.toUpperCase()}`, 10, 42);
  doc.text(`CODE : ${schoolCode}`, 100, 42);
  doc.text(`N° PERM : ${nPerm}`, 160, 42);

  doc.rect(10, 45, pageWidth - 20, 15);
  doc.setFont("helvetica", "normal");
  const lastName = (student.lastName || "").toUpperCase();
  const firstName = student.firstName || "";
  doc.text(`ELEVE : ${lastName} ${firstName}`, 15, 51);
  const genderLabel =
    student.gender === "MALE"
      ? "M"
      : student.gender === "FEMALE"
        ? "F"
        : student.gender || "NS";
  doc.text(`SEXE : ${genderLabel}`, 130, 51);
  doc.text(
    `CLASSE : ${typeof student.class === "object" ? student.class?.name : (student as unknown as { className?: string }).className || "Classe"}`,
    180,
    51,
  );

  let birthInfo = "Non spécifié";
  if (student.dateOfBirth) {
    try {
      const d = new Date(student.dateOfBirth);
      if (!isNaN(d.getTime())) {
        birthInfo = d.toLocaleDateString("fr-FR");
      }
    } catch (e) {
      console.warn("Invalid date of birth:", student.dateOfBirth);
    }
  }

  doc.text(
    `Né(e) à : ${student.address || "Non spécifié"} le ${birthInfo}`,
    15,
    57,
  );

  // TABLE CONFIGURATION
  const headers = [
    [
      { content: "BRANCHES", rowSpan: 2 },
      { content: "MAX", rowSpan: 2 },
      { content: "1er TRIMESTRE", colSpan: 6 },
      { content: "2ème TRIMESTRE", colSpan: 6 },
      { content: "3ème TRIMESTRE", colSpan: 6 },
      { content: "TOTAL ANNUEL", rowSpan: 2 },
    ],
    [
      "Max Période",
      "1ère Période",
      "2ème Période", 
      "Max Exam", // Max Période *2
      "PTS Obtenu d'Examen",
      "Max Trim", //Max Exam *2
      "PTS Obtenu Trimestre",
      "Max Période",
      "3ème Période",
      "4ème Période",
      "Max Exam", // Max Période *2
      "PTS Obtenu d'Examen",
      "Max Trim", //Max Exam *2
      "PTS Obtenu Trimestre",
      "Max Période",
      "5ème Période",
      "6ème Période",
      "Max Exam",// Max Période *2
      "PTS Obtenu d'Examen", 
      "Max Trim", //Max Exam *2
      "PTS Obtenu Trimestre",
      "PTS Total",
    ],
  ];

  const tableRows: (
    | string
    | { content: string; styles?: any; colSpan?: number }
  )[][] = [];
  let maxGeneral = 0;
  const totalGeneral = { t1: 0, t2: 0, t3: 0, annual: 0 };

  // Helper function to calculate trimester data
  const calculateTrimesterData = (grades: any[], trimester: number) => {
    const trimesterGrades = grades.filter(g => g.trimester === trimester);
    const maxPeriode = 50; // Assuming 50 points per period, adjust as needed
    const periode1 = trimesterGrades[0]?.interrogation1 || 0;
    const periode2 = trimesterGrades[0]?.interrogation2 || 0;
    const maxExam = maxPeriode * 2;
    const ptsObtenuExamen = trimesterGrades[0]?.examen || 0;
    const maxTrim = maxExam * 2;
    const ptsObtenuTrimestre = (periode1 || 0) + (periode2 || 0) + (ptsObtenuExamen || 0);
    
    return {
      maxPeriode,
      periode1,
      periode2,
      maxExam,
      ptsObtenuExamen,
      maxTrim,
      ptsObtenuTrimestre
    };
  };

  if (formatConfig && formatConfig.branches) {
    formatConfig.branches.forEach((branch) => {
      const branchTotal = { t1: 0, t2: 0, t3: 0, annual: 0 };
      // Branch Header Row
      tableRows.push([
        {
          content: branch.name || "BRANCHE SANS NOM",
          styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
        },
        {
          content: (branch.maxPoints || 0).toString(),
          styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
        },
        { content: "", colSpan: 19, styles: { fillColor: [240, 240, 240] } },
      ]);

      branch.subjects.forEach((subject) => {
        // Find grades for this subject across all trimesters
        const subjectGrades = grades.filter((g) => {
          const gSubject = typeof g.subjectId === "object" ? g.subjectId : null;
          const gSubjectId = gSubject
            ? gSubject._id || gSubject.id
            : g.subjectId;
          const gCode = gSubject?.code;
          const gName = gSubject?.name;

          return (
            (subject.code && gCode === subject.code) ||
            (gName && gName.toLowerCase() === subject.name.toLowerCase())
          );
        });

        // Calculate data for each trimester
        const t1Data = calculateTrimesterData(subjectGrades, 1);
        const t2Data = calculateTrimesterData(subjectGrades, 2);
        const t3Data = calculateTrimesterData(subjectGrades, 3);
        const ptsTotal = t1Data.ptsObtenuTrimestre + t2Data.ptsObtenuTrimestre + t3Data.ptsObtenuTrimestre;

        tableRows.push([
          "  " + subject.name,
          subject.maxPoints.toString(),
          // 1er Trimestre
          t1Data.maxPeriode.toString(),
          t1Data.periode1?.toString() || "",
          t1Data.periode2?.toString() || "",
          t1Data.maxExam.toString(),
          t1Data.ptsObtenuExamen?.toString() || "",
          t1Data.maxTrim.toString(),
          t1Data.ptsObtenuTrimestre.toString(),
          // 2ème Trimestre
          t2Data.maxPeriode.toString(),
          t2Data.periode1?.toString() || "",
          t2Data.periode2?.toString() || "",
          t2Data.maxExam.toString(),
          t2Data.ptsObtenuExamen?.toString() || "",
          t1Data.maxTrim.toString(),
          t2Data.ptsObtenuTrimestre.toString(),
          // 3ème Trimestre
          t3Data.maxPeriode.toString(),
          t3Data.periode1?.toString() || "",
          t3Data.periode2?.toString() || "",
          t3Data.maxExam.toString(),
          t3Data.ptsObtenuExamen?.toString() || "",
          t1Data.maxTrim.toString(),
          t3Data.ptsObtenuTrimestre.toString(),
          // Total Annuel
          ptsTotal.toString(),
        ]);

        branchTotal.t1 += t1Data.ptsObtenuTrimestre;
        branchTotal.t2 += t2Data.ptsObtenuTrimestre;
        branchTotal.t3 += t3Data.ptsObtenuTrimestre;
        branchTotal.annual += ptsTotal;
      });

      // Branch Sub-Total Row
      tableRows.push([
        {
          content: `SOUS-TOTAL ${branch.name}`,
          styles: { fontStyle: "italic", fillColor: [250, 250, 250] },
        },
        {
          content: (branch.maxPoints || 0).toString(),
          styles: { fontStyle: "bold", fillColor: [250, 250, 250] },
        },
        // 1er Trimestre subtotal
        { content: "", styles: { fillColor: [250, 250, 250] } },
        { content: "", styles: { fillColor: [250, 250, 250] } },
        { content: "", styles: { fillColor: [250, 250, 250] } },
        { content: "", styles: { fillColor: [250, 250, 250] } },
        {
          content: branchTotal.t1.toString(),
          styles: { fontStyle: "bold", fillColor: [250, 250, 250] },
        },
        // 2ème Trimestre subtotal
        { content: "", styles: { fillColor: [250, 250, 250] } },
        { content: "", styles: { fillColor: [250, 250, 250] } },
        { content: "", styles: { fillColor: [250, 250, 250] } },
        { content: "", styles: { fillColor: [250, 250, 250] } },
        {
          content: branchTotal.t2.toString(),
          styles: { fontStyle: "bold", fillColor: [250, 250, 250] },
        },
        // 3ème Trimestre subtotal
        { content: "", styles: { fillColor: [250, 250, 250] } },
        { content: "", styles: { fillColor: [250, 250, 250] } },
        { content: "", styles: { fillColor: [250, 250, 250] } },
        { content: "", styles: { fillColor: [250, 250, 250] } },
        {
          content: branchTotal.t3.toString(),
          styles: { fontStyle: "bold", fillColor: [250, 250, 250] },
        },
        // Annual subtotal
        {
          content: branchTotal.annual.toString(),
          styles: { fontStyle: "bold", fillColor: [250, 250, 250] },
        },
      ]);

      maxGeneral += branch.maxPoints || 0;
      totalGeneral.t1 += branchTotal.t1;
      totalGeneral.t2 += branchTotal.t2;
      totalGeneral.t3 += branchTotal.t3;
      totalGeneral.annual += branchTotal.annual;
    });
  } else {
    console.warn("No branches found in formatConfig");
  }

  // Footer Totals Row
  tableRows.push([
    {
      content: "TOTAL GENERAL",
      styles: { fontStyle: "bold", fillColor: [220, 220, 220] },
    },
    {
      content: maxGeneral.toString(),
      styles: { fontStyle: "bold", fillColor: [220, 220, 220] },
    },
    { content: "", styles: { fillColor: [220, 220, 220] } },
    { content: "", styles: { fillColor: [220, 220, 220] } },
    { content: "", styles: { fillColor: [220, 220, 220] } },
    { content: "", styles: { fillColor: [220, 220, 220] } },
    {
      content: totalGeneral.t1.toString(),
      styles: { fontStyle: "bold", fillColor: [220, 220, 220] },
    },
    { content: "", styles: { fillColor: [220, 220, 220] } },
    { content: "", styles: { fillColor: [220, 220, 220] } },
    { content: "", styles: { fillColor: [220, 220, 220] } },
    { content: "", styles: { fillColor: [220, 220, 220] } },
    {
      content: totalGeneral.t2.toString(),
      styles: { fontStyle: "bold", fillColor: [220, 220, 220] },
    },
    { content: "", styles: { fillColor: [220, 220, 220] } },
    { content: "", styles: { fillColor: [220, 220, 220] } },
    { content: "", styles: { fillColor: [220, 220, 220] } },
    { content: "", styles: { fillColor: [220, 220, 220] } },
    {
      content: totalGeneral.t3.toString(),
      styles: { fontStyle: "bold", fillColor: [220, 220, 220] },
    },
    {
      content: totalGeneral.annual.toString(),
      styles: { fontStyle: "bold", fillColor: [220, 220, 220] },
    },
  ]);

  const percentage =
    maxGeneral > 0 ? (totalGeneral.annual / (maxGeneral * 3)) * 100 : 0;

  // Calculate obtention status
  const obtention = percentage >= 50 ? "ADMIS" : "AJOURNE";

  // Percentage Row
  tableRows.push([
    {
      content: "POURCENTAGE",
      styles: { fontStyle: "bold", fillColor: [245, 245, 245] },
    },
    {
      content: "100%",
      styles: { fontStyle: "bold", fillColor: [245, 245, 245] },
    },
    // 1er Trimestre percentage
    { content: "", colSpan: 5, styles: { fillColor: [245, 245, 245] } },
    {
      content:
        maxGeneral > 0
          ? `${Math.round((totalGeneral.t1 / maxGeneral) * 100)}%`
          : "",
      styles: { fontStyle: "bold", fillColor: [245, 245, 245] },
    },
    // 2ème Trimestre percentage
    { content: "", colSpan: 5, styles: { fillColor: [245, 245, 245] } },
    {
      content:
        maxGeneral > 0
          ? `${Math.round((totalGeneral.t2 / maxGeneral) * 100)}%`
          : "",
      styles: { fontStyle: "bold", fillColor: [245, 245, 245] },
    },
    // 3ème Trimestre percentage
    { content: "", colSpan: 5, styles: { fillColor: [245, 245, 245] } },
    {
      content:
        maxGeneral > 0
          ? `${Math.round((totalGeneral.t3 / maxGeneral) * 100)}%`
          : "",
      styles: { fontStyle: "bold", fillColor: [245, 245, 245] },
    },
    // Annual percentage
    {
      content: `${Math.round(percentage)}%`,
      styles: {
        fontStyle: "bold",
        textColor: percentage >= 50 ? [0, 150, 0] : [200, 0, 0],
        fillColor: [245, 245, 245],
      },
    },
  ]);

  // Obtention Row
  tableRows.push([
    {
      content: "OBTENTION",
      styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
    },
    {
      content: obtention,
      styles: { 
        fontStyle: "bold", 
        fillColor: [240, 240, 240],
        textColor: obtention === "ADMIS" ? [0, 150, 0] : [200, 0, 0]
      },
    },
    { content: "", colSpan: 19, styles: { fillColor: [240, 240, 240] } },
  ]);

  autoTable(doc, {
    startY: 65,
    head: headers,
    body: tableRows,
    theme: "grid",
    styles: { fontSize: 7, cellPadding: 1, halign: "center" },
    headStyles: {
      fillColor: [220, 220, 220],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { halign: "left", cellWidth: 45 },
      1: { cellWidth: 12 },
    },
  });

  const lastTable = doc.lastAutoTable;
  const finalY = lastTable ? lastTable.finalY + 5 : 70;

  // Bottom Section: Decision & Signatures
  doc.setFontSize(8);
  doc.rect(10, Math.min(finalY, pageHeight - 40), 180, 25);
  doc.text(
    "Observations : ....................................................................................................................................",
    12,
    finalY + 7,
  );
  doc.text(
    "L'élève passe / double / a échoué (biffer les mentions inutiles)",
    12,
    finalY + 21,
  );

  const sigY = Math.min(finalY + 35, pageHeight - 15);
  doc.text("Signature de l'Enseignant", 30, sigY);
  doc.text("Signature du Chef d'Etablissement", pageWidth / 2, sigY, {
    align: "center",
  });
  doc.text("Signature du Parent", pageWidth - 50, sigY);

  doc.setFontSize(7);
  doc.text(
    `Généré par Scholar-Buddy-Link le ${new Date().toLocaleDateString("fr-FR")}`,
    pageWidth / 2,
    pageHeight - 5,
    { align: "center" },
  );

  const safeAcademicYear = (academicYear || "2024-2025").replace(/\//g, "-");
  const safeSchoolName = (schoolName || "Ecole").replace(/\s+/g, "_");
  doc.save(
    `Bulletin_${safeSchoolName}_${formatConfig.id.toUpperCase()}_${lastName}_${firstName}_${safeAcademicYear}.pdf`,
  );
};
