/* eslint-disable @typescript-eslint/no-explicit-any */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Student, Grade } from "@/types";

interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: { finalY: number };
}

export interface PersonalizedComment {
  subjectId: string;
  comment: string;
}

export interface BulletinData {
  student: Student;
  grades: Grade[];
  trimester: 1 | 2 | 3;
  academicYear: string;
  schoolName: string;
  schoolAddress?: string;
  schoolLogo?: string;
  generalComment: string;
  personalizedComments: PersonalizedComment[];
  classRanking?: number;
  totalStudents?: number;
  classAverage?: number;
  province?: string;
  town?: string;
  commune?: string;
  maxScale?: number;
}

export interface AnnualBulletinData {
  student: Student;
  grades: Grade[]; // All grades across all trimesters
  academicYear: string;
  schoolName: string;
  schoolAddress?: string;
  schoolLogo?: string;
  province?: string;
  town?: string;
  commune?: string;
  maxScale?: number;
  classRankings?: { [trimester: number]: number };
  totalStudents?: number;
}

// ==========================================
// DOMAIN GROUPING
// ==========================================

interface SubjectDomain {
  name: string;
  categories: string[];
}

const SUBJECT_DOMAINS: SubjectDomain[] = [
  { name: "DOMAINE DES SCIENCES", categories: ["scientifique"] },
  { name: "DOMAINE DES LANGUES", categories: ["litteraire"] },
  { name: "DOMAINE DES ARTS", categories: ["artistique"] },
  { name: "DOMAINE DU DEVELOPPEMENT PERSONNEL", categories: ["sportif"] },
];

function groupGradesByDomain(
  grades: Grade[],
): { domain: string; grades: Grade[] }[] {
  const grouped: { domain: string; grades: Grade[] }[] = [];
  const used = new Set<string>();

  // 1. First, group by explicit 'domaine' field on the subject (priority)
  const explicitDomains = new Map<string, Grade[]>();
  for (const g of grades) {
    const subject = typeof g.subjectId === "object" ? g.subjectId : null;
    if (!subject) continue;
    const domaine = (subject as any).domaine;
    if (domaine) {
      if (!explicitDomains.has(domaine)) explicitDomains.set(domaine, []);
      explicitDomains.get(domaine)!.push(g);
      used.add(g.id);
    }
  }
  for (const [domain, domGrades] of explicitDomains) {
    grouped.push({ domain: domain.toUpperCase(), grades: domGrades });
  }

  // 2. Fallback: group remaining grades by category
  for (const domain of SUBJECT_DOMAINS) {
    const domainGrades = grades.filter((g) => {
      if (used.has(g.id)) return false;
      const subject = typeof g.subjectId === "object" ? g.subjectId : null;
      if (!subject) return false;
      const cat = (subject as any).category || "";
      return domain.categories.includes(cat);
    });
    if (domainGrades.length > 0) {
      domainGrades.forEach((g) => used.add(g.id));
      grouped.push({ domain: domain.name, grades: domainGrades });
    }
  }

  const remaining = grades.filter((g) => !used.has(g.id));
  if (remaining.length > 0) {
    grouped.push({ domain: "AUTRES BRANCHES", grades: remaining });
  }

  return grouped;
}

// Collect unique subjects across all grades
function getUniqueSubjects(grades: Grade[]): any[] {
  const seen = new Set<string>();
  const subjects: any[] = [];
  for (const g of grades) {
    const subject = typeof g.subjectId === "object" ? g.subjectId : null;
    if (!subject) continue;
    const id = (subject as any)._id || (subject as any).id || "";
    if (id && !seen.has(id)) {
      seen.add(id);
      subjects.push(subject);
    }
  }
  return subjects;
}

// ==========================================
// HELPERS
// ==========================================

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

const getMention = (percentage: number): string => {
  if (percentage >= 90) return "ELITE";
  if (percentage >= 80) return "EXCELLENT";
  if (percentage >= 70) return "TRES BIEN";
  if (percentage >= 60) return "BIEN";
  if (percentage >= 50) return "PASSABLE";
  return "INSUFFISANT";
};

// ==========================================
// DRAW OFFICIAL HEADER (shared)
// ==========================================
function drawOfficialHeader(
  doc: jsPDFWithAutoTable,
  opts: {
    pageWidth: number;
    margin: number;
    schoolName: string;
    schoolLogo?: string | null;
    province: string;
    town: string;
    commune: string;
    student: Student;
    title: string;
    academicYear: string;
  },
): number {
  const { pageWidth, margin, schoolName, province, town, commune, student } = opts;

  doc.setDrawColor(0);
  doc.setLineWidth(0.3);

  // Left: Republic info
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("REPUBLIQUE DEMOCRATIQUE DU CONGO", margin, 8);
  doc.setFontSize(6);
  doc.text("MINISTERE DE L'ENSEIGNEMENT PRIMAIRE, SECONDAIRE", margin, 12);
  doc.text("ET PROFESSIONNEL", margin, 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.text(`PROVINCE : ${province.toUpperCase()}`, margin, 20);
  doc.text(`VILLE : ${town.toUpperCase()}`, margin, 23);
  doc.text(`COMMUNE/TER : ${commune.toUpperCase()}`, margin, 26);

  // Right: School info
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text(`ECOLE : ${schoolName.toUpperCase()}`, pageWidth - margin, 8, { align: "right" });
  doc.text(`CODE :`, pageWidth - margin, 12, { align: "right" });
  doc.text(`N° PERM : ${student.matricule || "N/A"}`, pageWidth - margin, 16, { align: "right" });

  // Title bar
  const titleY = 29;
  doc.setFillColor(220, 220, 220);
  doc.rect(margin, titleY, pageWidth - margin * 2, 7, "F");
  doc.setDrawColor(0);
  doc.rect(margin, titleY, pageWidth - margin * 2, 7);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(
    `${opts.title} - ANNEE SCOLAIRE ${opts.academicYear}`,
    pageWidth / 2,
    titleY + 5,
    { align: "center" },
  );

  // Student Info Bar
  const infoY = titleY + 9;
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.rect(margin, infoY, pageWidth - margin * 2, 10);

  const className = typeof student.class === "object" ? student.class?.name : "N/A";
  const genderLabel = student.gender === "MALE" ? "M" : student.gender === "FEMALE" ? "F" : "-";
  const birthDate = student.dateOfBirth
    ? new Date(student.dateOfBirth).toLocaleDateString("fr-FR")
    : "N/A";

  doc.setFont("helvetica", "bold");
  doc.text(`ELEVE : ${student.lastName.toUpperCase()} ${student.firstName}`, margin + 3, infoY + 4);
  doc.text(`SEXE : ${genderLabel}`, 120, infoY + 4);
  doc.text(`NE(E) LE : ${birthDate}`, 150, infoY + 4);
  doc.text(`CLASSE : ${className}`, margin + 3, infoY + 8);
  doc.text(`N° : ${student.matricule || ""}`, 120, infoY + 8);

  const studentCount = typeof student.class === "object" && student.class?.studentCount
    ? student.class.studentCount
    : "-";
  doc.text(`EFFECTIF : ${studentCount}`, 200, infoY + 8);

  return infoY + 13; // return tableStartY
}

// ==========================================
// DRAW SIGNATURES (shared)
// ==========================================
function drawSignatures(doc: jsPDFWithAutoTable, finalY: number, pageWidth: number, pageHeight: number, margin: number) {
  const sigY = Math.min(finalY + 10, pageHeight - 22);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");

  doc.text("Sceau de l'école", margin + 15, sigY, { align: "center" });
  doc.line(margin, sigY + 2, margin + 35, sigY + 2);

  doc.text("Le Chef d'Etablissement", pageWidth / 2, sigY, { align: "center" });
  doc.line(pageWidth / 2 - 25, sigY + 2, pageWidth / 2 + 25, sigY + 2);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("Nom et Signature", pageWidth / 2, sigY + 6, { align: "center" });

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("Signature de l'Elève", pageWidth - margin - 20, sigY, { align: "center" });
  doc.line(pageWidth - margin - 40, sigY + 2, pageWidth - margin, sigY + 2);
}

function drawFooter(doc: jsPDFWithAutoTable, pageWidth: number, pageHeight: number, margin: number) {
  doc.setFontSize(5);
  doc.setTextColor(100);
  doc.setFont("helvetica", "italic");
  doc.text(
    "NB : Ce bulletin est un document officiel. Toute falsification est passible de poursuites.",
    pageWidth / 2,
    pageHeight - 5,
    { align: "center" },
  );
  const dateStr = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date());
  doc.text(`Généré le ${dateStr}`, pageWidth - margin, pageHeight - 5, { align: "right" });
  doc.setTextColor(0);
}

// ==========================================
// SINGLE TRIMESTER BULLETIN (existing)
// ==========================================

export const generatePersonalizedBulletinPDF = async (
  data: BulletinData,
): Promise<void> => {
  const {
    student,
    grades,
    trimester,
    academicYear,
    schoolName,
    schoolLogo,
    generalComment,
    personalizedComments,
    classRanking,
    totalStudents,
    province = "KINSHASA",
    town = "KINSHASA",
    commune = "NON SPECIFIE",
    maxScale = 20,
  } = data;

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  }) as jsPDFWithAutoTable;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 8;

  // Load logo
  let logoData: string | null = null;
  if (schoolLogo) {
    logoData = schoolLogo.startsWith("data:")
      ? schoolLogo
      : await loadImageAsBase64(schoolLogo);
  }
  if (logoData) {
    try { doc.addImage(logoData, "PNG", pageWidth / 2 - 10, 4, 20, 20); } catch { /* skip */ }
  }

  const trimLabel = trimester === 1 ? "1er" : trimester === 2 ? "2ème" : "3ème";
  const tableStartY = drawOfficialHeader(doc, {
    pageWidth, margin, schoolName, schoolLogo: logoData, province, town, commune, student,
    title: `BULLETIN DE LA ${trimLabel} PERIODE`,
    academicYear,
  });

  const trimesterGrades = grades.filter((g) => g.trimester === trimester);
  const domainGroups = groupGradesByDomain(trimesterGrades);

  // Build table rows
  const tableBody: any[][] = [];
  let grandTotalMax = 0;
  let grandTotalObt = 0;

  domainGroups.forEach((group) => {
    tableBody.push([
      {
        content: group.domain,
        colSpan: 9,
        styles: { fillColor: [230, 230, 230], fontStyle: "bold" as const, fontSize: 6, halign: "left" as const },
      },
    ]);

    let domainTotalMax = 0;
    let domainTotalObt = 0;

    group.grades.forEach((grade) => {
      const subject = typeof grade.subjectId === "object" ? grade.subjectId : null;
      const coef = subject?.coefficient || 1;
      const max = maxScale * coef;
      const moyenne = grade.moyenne || 0;
      const total = moyenne * coef;

      domainTotalMax += max;
      domainTotalObt += total;

      const personalComment = personalizedComments.find(
        (c) => c.subjectId === (subject ? (subject as any)._id || (subject as any).id : grade.subjectId),
      );

      tableBody.push([
        subject ? subject.name : "N/A",
        max.toString(),
        grade.interrogation1 !== null ? grade.interrogation1?.toString() : "-",
        grade.interrogation2 !== null ? grade.interrogation2?.toString() : "-",
        grade.devoir !== null ? grade.devoir?.toString() : "-",
        grade.examen !== null ? grade.examen?.toString() : "-",
        moyenne.toFixed(1),
        total.toFixed(1),
        personalComment?.comment || grade.appreciation || "",
      ]);
    });

    grandTotalMax += domainTotalMax;
    grandTotalObt += domainTotalObt;

    tableBody.push([
      { content: "SOUS-TOTAL", styles: { fontStyle: "bold" as const, fontSize: 6 } },
      { content: domainTotalMax.toString(), styles: { fontStyle: "bold" as const } },
      "", "", "", "",
      "",
      { content: domainTotalObt.toFixed(1), styles: { fontStyle: "bold" as const } },
      "",
    ]);
  });

  const headers = [
    [
      { content: "BRANCHE", rowSpan: 2, styles: { halign: "left" as const } },
      { content: "MAX", rowSpan: 2 },
      { content: `${trimLabel.toUpperCase()} TRIMESTRE`, colSpan: 4 },
      { content: "TOTAL", rowSpan: 2 },
      { content: "SIGN.\nPROF", rowSpan: 2 },
    ],
    ["1ère Pér", "2è Pér", "T.P./Dev", "Examen"],
  ];

  autoTable(doc, {
    startY: tableStartY,
    head: headers as any,
    body: tableBody,
    theme: "grid",
    styles: { fontSize: 6, cellPadding: 1, halign: "center", lineWidth: 0.15, lineColor: [0, 0, 0], textColor: [0, 0, 0] },
    headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: "bold", fontSize: 6, halign: "center" },
    columnStyles: {
      0: { halign: "left", cellWidth: 50 },
      1: { cellWidth: 14 },
      2: { cellWidth: 16 },
      3: { cellWidth: 16 },
      4: { cellWidth: 16 },
      5: { cellWidth: 16 },
      6: { cellWidth: 16 },
      7: { cellWidth: 16 },
      8: { halign: "left", cellWidth: pageWidth - margin * 2 - 160 },
    },
    margin: { left: margin, right: margin },
  });

  let finalY = doc.lastAutoTable.finalY;

  // Summary rows
  const summaryY = finalY + 1;
  const rowH = 5;
  const percentage = grandTotalMax > 0 ? (grandTotalObt / grandTotalMax) * 100 : 0;

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");

  doc.rect(margin, summaryY, pageWidth - margin * 2, rowH);
  doc.text("MAXIMA GENERAUX", margin + 3, summaryY + 3.5);
  doc.text(grandTotalMax.toString(), margin + 65, summaryY + 3.5);

  doc.rect(margin, summaryY + rowH, pageWidth - margin * 2, rowH);
  doc.text("TOTAL OBTENU", margin + 3, summaryY + rowH + 3.5);
  doc.text(grandTotalObt.toFixed(1), margin + 65, summaryY + rowH + 3.5);

  doc.rect(margin, summaryY + rowH * 2, pageWidth - margin * 2, rowH);
  doc.text("POURCENTAGE", margin + 3, summaryY + rowH * 2 + 3.5);
  doc.text(`${percentage.toFixed(1)}%`, margin + 65, summaryY + rowH * 2 + 3.5);
  doc.text(`MENTION : ${getMention(percentage)}`, margin + 100, summaryY + rowH * 2 + 3.5);

  doc.rect(margin, summaryY + rowH * 3, pageWidth - margin * 2, rowH);
  doc.text("PLACE/NBRE D'ELEVES", margin + 3, summaryY + rowH * 3 + 3.5);
  if (classRanking && totalStudents) {
    doc.text(`${classRanking} / ${totalStudents}`, margin + 65, summaryY + rowH * 3 + 3.5);
  }

  finalY = summaryY + rowH * 4;

  // Appreciation
  const appreciationY = finalY + 2;
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.text("APPRECIATION :", margin, appreciationY + 3);
  doc.setFont("helvetica", "italic");
  const splitComment = doc.splitTextToSize(generalComment, pageWidth - margin * 2 - 30);
  doc.text(splitComment, margin + 28, appreciationY + 3);

  const decisionY = appreciationY + 8;
  doc.setFont("helvetica", "bold");
  doc.text("CONDUITE :", margin, decisionY);
  doc.text("APPLICATION :", margin + 50, decisionY);

  drawSignatures(doc, decisionY, pageWidth, pageHeight, margin);
  drawFooter(doc, pageWidth, pageHeight, margin);

  const safeSchoolName = schoolName.replace(/\s+/g, "_");
  doc.save(`Bulletin_${safeSchoolName}_${student.lastName}_T${trimester}.pdf`);
};

// ==========================================
// ANNUAL BULLETIN - ALL TRIMESTERS + RECAP
// ==========================================

export const generateAnnualBulletinPDF = async (
  data: AnnualBulletinData,
): Promise<void> => {
  const {
    student,
    grades,
    academicYear,
    schoolName,
    schoolLogo,
    province = "KINSHASA",
    town = "KINSHASA",
    commune = "NON SPECIFIE",
    maxScale = 20,
    classRankings = {},
    totalStudents,
  } = data;

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  }) as jsPDFWithAutoTable;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 8;

  // Load logo
  let logoData: string | null = null;
  if (schoolLogo) {
    logoData = schoolLogo.startsWith("data:")
      ? schoolLogo
      : await loadImageAsBase64(schoolLogo);
  }
  if (logoData) {
    try { doc.addImage(logoData, "PNG", pageWidth / 2 - 10, 4, 20, 20); } catch { /* skip */ }
  }

  const tableStartY = drawOfficialHeader(doc, {
    pageWidth, margin, schoolName, schoolLogo: logoData, province, town, commune, student,
    title: "BULLETIN ANNUEL - RECAPITULATIF",
    academicYear,
  });

  // Collect unique subjects
  const allSubjects = getUniqueSubjects(grades);

  // Group by domain using a "fake" grade list with unique subjects for domain grouping
  const fakeGradesForGrouping: Grade[] = allSubjects.map((s, i) => ({
    id: `fake_${i}`,
    subjectId: s,
    studentId: student.id,
    trimester: 1 as const,
    interrogation1: null,
    interrogation2: null,
    devoir: null,
    examen: null,
    moyenne: null,
    appreciation: "",
    academicYear,
  }));
  const domainGroups = groupGradesByDomain(fakeGradesForGrouping);

  // Helper to find a grade for a subject in a specific trimester
  const findGrade = (subjectObj: any, trimester: number): Grade | undefined => {
    const subId = subjectObj._id || subjectObj.id;
    return grades.find((g) => {
      const gSub = typeof g.subjectId === "object" ? g.subjectId : null;
      if (!gSub) return false;
      const gId = (gSub as any)._id || (gSub as any).id;
      return gId === subId && g.trimester === trimester;
    });
  };

  // Build table
  const tableBody: any[][] = [];
  let grandTotalMax = 0;
  const grandTotals = { t1: 0, t2: 0, t3: 0, annual: 0 };

  domainGroups.forEach((group) => {
    // Domain header
    tableBody.push([
      {
        content: group.domain,
        colSpan: 14,
        styles: { fillColor: [220, 220, 220], fontStyle: "bold" as const, fontSize: 6, halign: "left" as const },
      },
    ]);

    let domainMax = 0;
    const domainTotals = { t1: 0, t2: 0, t3: 0, annual: 0 };

    group.grades.forEach((fakeGrade) => {
      const subject = typeof fakeGrade.subjectId === "object" ? fakeGrade.subjectId : null;
      if (!subject) return;
      const coef = subject.coefficient || 1;
      const max = maxScale * coef;
      domainMax += max;

      const g1 = findGrade(subject, 1);
      const g2 = findGrade(subject, 2);
      const g3 = findGrade(subject, 3);

      const t1Total = (g1?.moyenne || 0) * coef;
      const t2Total = (g2?.moyenne || 0) * coef;
      const t3Total = (g3?.moyenne || 0) * coef;
      const annualTotal = t1Total + t2Total + t3Total;

      domainTotals.t1 += t1Total;
      domainTotals.t2 += t2Total;
      domainTotals.t3 += t3Total;
      domainTotals.annual += annualTotal;

      tableBody.push([
        subject.name,
        max.toString(),
        // T1
        g1?.interrogation1 !== null && g1?.interrogation1 !== undefined ? g1.interrogation1.toString() : "-",
        g1?.examen !== null && g1?.examen !== undefined ? g1.examen.toString() : "-",
        t1Total > 0 ? t1Total.toFixed(1) : "-",
        // T2
        g2?.interrogation1 !== null && g2?.interrogation1 !== undefined ? g2.interrogation1.toString() : "-",
        g2?.examen !== null && g2?.examen !== undefined ? g2.examen.toString() : "-",
        t2Total > 0 ? t2Total.toFixed(1) : "-",
        // T3
        g3?.interrogation1 !== null && g3?.interrogation1 !== undefined ? g3.interrogation1.toString() : "-",
        g3?.examen !== null && g3?.examen !== undefined ? g3.examen.toString() : "-",
        t3Total > 0 ? t3Total.toFixed(1) : "-",
        // Annual
        annualTotal > 0 ? annualTotal.toFixed(1) : "-",
        // Max annual (max * 3)
        (max * 3).toString(),
        // Sign
        "",
      ]);
    });

    grandTotalMax += domainMax;
    grandTotals.t1 += domainTotals.t1;
    grandTotals.t2 += domainTotals.t2;
    grandTotals.t3 += domainTotals.t3;
    grandTotals.annual += domainTotals.annual;

    // Domain subtotal
    tableBody.push([
      { content: "SOUS-TOTAL", styles: { fontStyle: "bold" as const, fontSize: 6, fillColor: [240, 240, 240] } },
      { content: domainMax.toString(), styles: { fontStyle: "bold" as const, fillColor: [240, 240, 240] } },
      { content: "", styles: { fillColor: [240, 240, 240] } },
      { content: "", styles: { fillColor: [240, 240, 240] } },
      { content: domainTotals.t1.toFixed(1), styles: { fontStyle: "bold" as const, fillColor: [240, 240, 240] } },
      { content: "", styles: { fillColor: [240, 240, 240] } },
      { content: "", styles: { fillColor: [240, 240, 240] } },
      { content: domainTotals.t2.toFixed(1), styles: { fontStyle: "bold" as const, fillColor: [240, 240, 240] } },
      { content: "", styles: { fillColor: [240, 240, 240] } },
      { content: "", styles: { fillColor: [240, 240, 240] } },
      { content: domainTotals.t3.toFixed(1), styles: { fontStyle: "bold" as const, fillColor: [240, 240, 240] } },
      { content: domainTotals.annual.toFixed(1), styles: { fontStyle: "bold" as const, fillColor: [240, 240, 240] } },
      { content: (domainMax * 3).toString(), styles: { fontStyle: "bold" as const, fillColor: [240, 240, 240] } },
      { content: "", styles: { fillColor: [240, 240, 240] } },
    ]);
  });

  // TOTAL GENERAL row
  const annualMax = grandTotalMax * 3;
  tableBody.push([
    { content: "TOTAL GENERAL", styles: { fontStyle: "bold" as const, fillColor: [200, 200, 200] } },
    { content: grandTotalMax.toString(), styles: { fontStyle: "bold" as const, fillColor: [200, 200, 200] } },
    { content: "", styles: { fillColor: [200, 200, 200] } },
    { content: "", styles: { fillColor: [200, 200, 200] } },
    { content: grandTotals.t1.toFixed(1), styles: { fontStyle: "bold" as const, fillColor: [200, 200, 200] } },
    { content: "", styles: { fillColor: [200, 200, 200] } },
    { content: "", styles: { fillColor: [200, 200, 200] } },
    { content: grandTotals.t2.toFixed(1), styles: { fontStyle: "bold" as const, fillColor: [200, 200, 200] } },
    { content: "", styles: { fillColor: [200, 200, 200] } },
    { content: "", styles: { fillColor: [200, 200, 200] } },
    { content: grandTotals.t3.toFixed(1), styles: { fontStyle: "bold" as const, fillColor: [200, 200, 200] } },
    { content: grandTotals.annual.toFixed(1), styles: { fontStyle: "bold" as const, fillColor: [200, 200, 200] } },
    { content: annualMax.toString(), styles: { fontStyle: "bold" as const, fillColor: [200, 200, 200] } },
    { content: "", styles: { fillColor: [200, 200, 200] } },
  ]);

  // POURCENTAGE row
  const pctT1 = grandTotalMax > 0 ? (grandTotals.t1 / grandTotalMax) * 100 : 0;
  const pctT2 = grandTotalMax > 0 ? (grandTotals.t2 / grandTotalMax) * 100 : 0;
  const pctT3 = grandTotalMax > 0 ? (grandTotals.t3 / grandTotalMax) * 100 : 0;
  const pctAnnual = annualMax > 0 ? (grandTotals.annual / annualMax) * 100 : 0;

  tableBody.push([
    { content: "POURCENTAGE", styles: { fontStyle: "bold" as const, fillColor: [245, 245, 245] } },
    { content: "100%", styles: { fontStyle: "bold" as const, fillColor: [245, 245, 245] } },
    { content: "", styles: { fillColor: [245, 245, 245] } },
    { content: "", styles: { fillColor: [245, 245, 245] } },
    { content: `${pctT1.toFixed(1)}%`, styles: { fontStyle: "bold" as const, fillColor: [245, 245, 245] } },
    { content: "", styles: { fillColor: [245, 245, 245] } },
    { content: "", styles: { fillColor: [245, 245, 245] } },
    { content: `${pctT2.toFixed(1)}%`, styles: { fontStyle: "bold" as const, fillColor: [245, 245, 245] } },
    { content: "", styles: { fillColor: [245, 245, 245] } },
    { content: "", styles: { fillColor: [245, 245, 245] } },
    { content: `${pctT3.toFixed(1)}%`, styles: { fontStyle: "bold" as const, fillColor: [245, 245, 245] } },
    {
      content: `${pctAnnual.toFixed(1)}%`,
      styles: {
        fontStyle: "bold" as const,
        fillColor: [245, 245, 245],
        textColor: pctAnnual >= 50 ? [0, 128, 0] : [200, 0, 0],
      },
    },
    { content: "", styles: { fillColor: [245, 245, 245] } },
    { content: "", styles: { fillColor: [245, 245, 245] } },
  ]);

  // MENTION row
  tableBody.push([
    { content: "MENTION", styles: { fontStyle: "bold" as const, fillColor: [235, 235, 235] } },
    { content: "", styles: { fillColor: [235, 235, 235] } },
    { content: "", styles: { fillColor: [235, 235, 235] } },
    { content: "", styles: { fillColor: [235, 235, 235] } },
    { content: getMention(pctT1), styles: { fontStyle: "bold" as const, fillColor: [235, 235, 235] } },
    { content: "", styles: { fillColor: [235, 235, 235] } },
    { content: "", styles: { fillColor: [235, 235, 235] } },
    { content: getMention(pctT2), styles: { fontStyle: "bold" as const, fillColor: [235, 235, 235] } },
    { content: "", styles: { fillColor: [235, 235, 235] } },
    { content: "", styles: { fillColor: [235, 235, 235] } },
    { content: getMention(pctT3), styles: { fontStyle: "bold" as const, fillColor: [235, 235, 235] } },
    { content: getMention(pctAnnual), styles: { fontStyle: "bold" as const, fillColor: [235, 235, 235], textColor: pctAnnual >= 50 ? [0, 128, 0] : [200, 0, 0] } },
    { content: "", styles: { fillColor: [235, 235, 235] } },
    { content: "", styles: { fillColor: [235, 235, 235] } },
  ]);

  // PLACE row
  tableBody.push([
    { content: "PLACE / EFFECTIF", styles: { fontStyle: "bold" as const, fillColor: [245, 245, 245] } },
    { content: "", styles: { fillColor: [245, 245, 245] } },
    { content: "", styles: { fillColor: [245, 245, 245] } },
    { content: "", styles: { fillColor: [245, 245, 245] } },
    { content: classRankings[1] && totalStudents ? `${classRankings[1]}/${totalStudents}` : "", styles: { fillColor: [245, 245, 245] } },
    { content: "", styles: { fillColor: [245, 245, 245] } },
    { content: "", styles: { fillColor: [245, 245, 245] } },
    { content: classRankings[2] && totalStudents ? `${classRankings[2]}/${totalStudents}` : "", styles: { fillColor: [245, 245, 245] } },
    { content: "", styles: { fillColor: [245, 245, 245] } },
    { content: "", styles: { fillColor: [245, 245, 245] } },
    { content: classRankings[3] && totalStudents ? `${classRankings[3]}/${totalStudents}` : "", styles: { fillColor: [245, 245, 245] } },
    { content: "", styles: { fillColor: [245, 245, 245] } },
    { content: "", styles: { fillColor: [245, 245, 245] } },
    { content: "", styles: { fillColor: [245, 245, 245] } },
  ]);

  // Column headers
  const headers = [
    [
      { content: "BRANCHE", rowSpan: 2, styles: { halign: "left" as const } },
      { content: "MAX", rowSpan: 2 },
      { content: "1er TRIMESTRE", colSpan: 3 },
      { content: "2ème TRIMESTRE", colSpan: 3 },
      { content: "3ème TRIMESTRE", colSpan: 3 },
      { content: "TOTAL\nANNUEL", rowSpan: 2 },
      { content: "MAX\nANN.", rowSpan: 2 },
      { content: "SIGN.\nPROF", rowSpan: 2 },
    ],
    [
      "Interr.", "Exam", "Total",
      "Interr.", "Exam", "Total",
      "Interr.", "Exam", "Total",
    ],
  ];

  autoTable(doc, {
    startY: tableStartY,
    head: headers as any,
    body: tableBody,
    theme: "grid",
    styles: {
      fontSize: 5.5,
      cellPadding: 0.8,
      halign: "center",
      lineWidth: 0.15,
      lineColor: [0, 0, 0],
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [200, 200, 200],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      fontSize: 5.5,
      halign: "center",
    },
    columnStyles: {
      0: { halign: "left", cellWidth: 40 },
      1: { cellWidth: 12 },
      2: { cellWidth: 14 },
      3: { cellWidth: 14 },
      4: { cellWidth: 16 },
      5: { cellWidth: 14 },
      6: { cellWidth: 14 },
      7: { cellWidth: 16 },
      8: { cellWidth: 14 },
      9: { cellWidth: 14 },
      10: { cellWidth: 16 },
      11: { cellWidth: 18 },
      12: { cellWidth: 14 },
      13: { halign: "center", cellWidth: pageWidth - margin * 2 - 216 },
    },
    margin: { left: margin, right: margin },
  });

  let finalY = doc.lastAutoTable.finalY;

  // Decision section
  const decisionY = finalY + 3;
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");

  doc.rect(margin, decisionY, pageWidth - margin * 2, 12);
  doc.text("DECISION DU CONSEIL DE CLASSE :", margin + 3, decisionY + 5);
  doc.setFont("helvetica", "normal");
  doc.text(
    pctAnnual >= 50
      ? "L'élève passe en classe supérieure"
      : "L'élève doit reprendre la classe (Redoublement)",
    margin + 70,
    decisionY + 5,
  );
  doc.setFont("helvetica", "bold");
  doc.text("CONDUITE :", margin + 3, decisionY + 10);
  doc.text("APPLICATION :", margin + 60, decisionY + 10);

  finalY = decisionY + 12;

  drawSignatures(doc, finalY, pageWidth, pageHeight, margin);
  drawFooter(doc, pageWidth, pageHeight, margin);

  const safeSchoolName = schoolName.replace(/\s+/g, "_");
  doc.save(`Bulletin_Annuel_${safeSchoolName}_${student.lastName}_${academicYear.replace(/\//g, "-")}.pdf`);
};

// ==========================================
// AUTO-COMMENTED BULLETIN
// ==========================================

export const generateAutoCommentedBulletin = async (
  student: Student,
  grades: Grade[],
  trimester: 1 | 2 | 3,
  academicYear: string,
  schoolName: string,
  schoolLogo?: string,
): Promise<void> => {
  const trimesterGrades = grades.filter((g) => g.trimester === trimester);

  const personalizedComments: PersonalizedComment[] = trimesterGrades.map((grade) => {
    const moyenne = grade.moyenne || 0;
    let comment = "";
    if (moyenne >= 18) comment = "Excellent travail !";
    else if (moyenne >= 16) comment = "Très bon trimestre.";
    else if (moyenne >= 14) comment = "Bon travail.";
    else if (moyenne >= 12) comment = "Assez Bien.";
    else if (moyenne >= 10) comment = "Passable.";
    else comment = "Insuffisant.";

    const subjectId =
      typeof grade.subjectId === "object"
        ? (grade.subjectId as any)._id || (grade.subjectId as any).id
        : (grade.subjectId as string);

    return { subjectId, comment };
  });

  let totalCoef = 0;
  let totalPoints = 0;
  trimesterGrades.forEach((grade) => {
    const subject = typeof grade.subjectId === "object" ? grade.subjectId : null;
    const coef = subject?.coefficient || 1;
    if (grade.moyenne !== null) {
      totalCoef += coef;
      totalPoints += (grade.moyenne || 0) * coef;
    }
  });
  const overallAverage = totalCoef > 0 ? totalPoints / totalCoef : 0;

  let generalComment = "";
  if (overallAverage >= 14) {
    generalComment = `Excellent trimestre pour ${student.firstName}. Travail exemplaire à maintenir.`;
  } else if (overallAverage >= 10) {
    generalComment = `Trimestre satisfaisant. ${student.firstName} peut encore progresser.`;
  } else {
    generalComment = `Trimestre difficile. Une remédiation est nécessaire pour ${student.firstName}.`;
  }

  await generatePersonalizedBulletinPDF({
    student,
    grades,
    trimester,
    academicYear,
    schoolName,
    schoolLogo,
    generalComment,
    personalizedComments,
  });
};
