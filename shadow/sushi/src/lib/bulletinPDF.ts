import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Student, Grade } from "@/types";

// Extend jsPDF type to include autoTable properties
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

// Structure des branches basée sur le modèle IK.ECC
export interface Branch {
  name: string;
  maxPoints: number;
  subjects: { name: string; maxPoints: number; subjectId?: string }[];
}

export const branchesConfig: Branch[] = [
  {
    name: "E.C.M",
    maxPoints: 20,
    subjects: [{ name: "E.C.M", maxPoints: 20 }],
  },
  {
    name: "AUTRES B",
    maxPoints: 40,
    subjects: [
      { name: "ANGLAIS", maxPoints: 20 },
      { name: "ART PLASTIQUE", maxPoints: 10 },
      { name: "BIBLIOTHEQUE", maxPoints: 10 },
    ],
  },
  {
    name: "FRANÇAIS",
    maxPoints: 70,
    subjects: [
      { name: "GRAM.CONJ.ANAL.", maxPoints: 20 },
      { name: "ELOC. VOC. RECIT.", maxPoints: 25 },
      { name: "REDACT.ORTH.", maxPoints: 15 },
      { name: "LECTURE", maxPoints: 10 },
    ],
  },
  {
    name: "MATHEMATIQUE",
    maxPoints: 50,
    subjects: [
      { name: "NUMERATION/OPS", maxPoints: 20 },
      { name: "GRANDEURS", maxPoints: 10 },
      { name: "FORMES GEOM.", maxPoints: 10 },
      { name: "PROBLEMES", maxPoints: 10 },
    ],
  },
  {
    name: "AUTRES BRANCHES",
    maxPoints: 50,
    subjects: [
      { name: "ED. SANTE & ENV.", maxPoints: 10 },
      { name: "HISTOIRE", maxPoints: 10 },
      { name: "GEOGRAPHIE", maxPoints: 10 },
      { name: "SCIENCES NAT.", maxPoints: 10 },
      { name: "INFORMATIQUE", maxPoints: 10 },
    ],
  },
  {
    name: "ACTIVITES PRATIQUES",
    maxPoints: 50,
    subjects: [
      { name: "ECOLOGIE", maxPoints: 10 },
      { name: "SPORT/ENGLISH", maxPoints: 10 },
      { name: "GEST.FIN", maxPoints: 10 },
      { name: "CALLIGRAPHIE", maxPoints: 10 },
      { name: "ART DRAMATIQUE", maxPoints: 10 },
    ],
  },
];

interface BulletinIKECCData {
  student: Student;
  grades: Grade[];
  academicYear: string;
  schoolName: string;
  schoolAddress: string;
  codeEcole: string;
  nPerm: string;
  schoolLogo?: string; // URL ou base64 du logo de l'école
}

// Fonction pour charger une image en base64
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

// Fonction pour dessiner un logo placeholder
const drawPlaceholderLogo = (doc: jsPDF): void => {
  doc.setDrawColor(150);
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(5, 3, 22, 22, 2, 2, "FD");
  doc.setFontSize(6);
  doc.setTextColor(100);
  doc.text("LOGO", 16, 12, { align: "center" });
  doc.text("ÉCOLE", 16, 17, { align: "center" });
  doc.setTextColor(0);
};

interface TrimesterGrades {
  [subjectName: string]: {
    t1: {
      eval1: number | null;
      eval2: number | null;
      exam: number | null;
      total: number | null;
    };
    t2: {
      eval1: number | null;
      eval2: number | null;
      exam: number | null;
      total: number | null;
    };
    t3: {
      eval1: number | null;
      eval2: number | null;
      exam: number | null;
      total: number | null;
    };
    annualTotal: number | null;
    maxPoints: number;
  };
}

export const generateBulletinIKECC = async (
  data: BulletinIKECCData,
): Promise<void> => {
  const {
    student,
    grades,
    academicYear,
    schoolName,
    codeEcole,
    nPerm,
    schoolLogo,
  } = data;
  const className =
    typeof student.class === "object" ? student.class?.name : "N/A";

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  }) as jsPDFWithAutoTable;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // En-tête avec logo
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, 25, "F");

  // Logo de l'école
  if (schoolLogo) {
    try {
      const logoData = schoolLogo.startsWith("data:")
        ? schoolLogo
        : await loadImageAsBase64(schoolLogo);
      if (logoData) {
        doc.addImage(logoData, "PNG", 5, 3, 22, 22);
      } else {
        drawPlaceholderLogo(doc);
      }
    } catch {
      drawPlaceholderLogo(doc);
    }
  } else {
    drawPlaceholderLogo(doc);
  }

  // Titre principal
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("BULLETIN DE L'ELEVE", pageWidth / 2, 10, { align: "center" });
  doc.setFontSize(10);
  doc.text(`ANNEE SCOLAIRE ${academicYear}`, pageWidth / 2, 16, {
    align: "center",
  });

  // Nom de l'école
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(schoolName, pageWidth / 2, 23, { align: "center" });

  // Code école et N° Perm
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`CODE ECOLE: ${codeEcole}`, 40, 28);
  doc.text(`N° PERM: ${nPerm}`, 120, 28);

  // Informations élève
  doc.setFontSize(9);
  doc.text(
    `NOM ET PRENOM: ${student.lastName.toUpperCase()} ${student.firstName}`,
    pageWidth - 80,
    10,
  );
  doc.text(`CLASSE: ${className}`, pageWidth - 80, 15);
  doc.text(`NE(E)A: ${student.address || "N/A"}`, pageWidth - 80, 20);
  doc.text(`SEXE: ${student.gender || "N/A"}`, pageWidth - 80, 25);

  // Organiser les notes par trimestre
  const trimesterGrades = organizeTrimesterGrades(grades);

  // Créer le tableau
  let startY = 35;
  const totalGeneral = { t1: 0, t2: 0, t3: 0, annual: 0 };
  const maxTotal = 280;

  branchesConfig.forEach((branch, branchIndex) => {
    const branchTotal = { t1: 0, t2: 0, t3: 0, annual: 0 };

    const tableData: (string | number)[][] = [];

    branch.subjects.forEach((subject) => {
      const gradeData = trimesterGrades[subject.name] || {
        t1: { eval1: null, eval2: null, exam: null, total: null },
        t2: { eval1: null, eval2: null, exam: null, total: null },
        t3: { eval1: null, eval2: null, exam: null, total: null },
        annualTotal: null,
        maxPoints: subject.maxPoints,
      };

      const t1Total = gradeData.t1.total || 0;
      const t2Total = gradeData.t2.total || 0;
      const t3Total = gradeData.t3.total || 0;
      const annualTotal = gradeData.annualTotal || 0;

      branchTotal.t1 += t1Total;
      branchTotal.t2 += t2Total;
      branchTotal.t3 += t3Total;
      branchTotal.annual += annualTotal;

      tableData.push([
        subject.name,
        subject.maxPoints.toString(),
        gradeData.t1.eval1?.toString() || "",
        gradeData.t1.eval2?.toString() || "",
        gradeData.t1.exam?.toString() || "",
        t1Total > 0 ? t1Total.toString() : "",
        gradeData.t2.eval1?.toString() || "",
        gradeData.t2.eval2?.toString() || "",
        gradeData.t2.exam?.toString() || "",
        t2Total > 0 ? t2Total.toString() : "",
        gradeData.t3.eval1?.toString() || "",
        gradeData.t3.eval2?.toString() || "",
        gradeData.t3.exam?.toString() || "",
        t3Total > 0 ? t3Total.toString() : "",
        annualTotal > 0 ? annualTotal.toString() : "",
      ]);
    });

    // Ligne de total de la branche
    tableData.push([
      "TOTAL",
      branch.maxPoints.toString(),
      "",
      "",
      "",
      branchTotal.t1.toString(),
      "",
      "",
      "",
      branchTotal.t2.toString(),
      "",
      "",
      "",
      branchTotal.t3.toString(),
      branchTotal.annual.toString(),
    ]);

    totalGeneral.t1 += branchTotal.t1;
    totalGeneral.t2 += branchTotal.t2;
    totalGeneral.t3 += branchTotal.t3;
    totalGeneral.annual += branchTotal.annual;

    autoTable(doc, {
      startY: startY,
      head:
        branchIndex === 0
          ? [
              [
                { content: "BRANCHES", rowSpan: 2 },
                { content: "MAX", rowSpan: 2 },
                { content: "PREMIER TRIMESTRE", colSpan: 4 },
                { content: "DEUXIEME TRIMESTRE", colSpan: 4 },
                { content: "TROISIEME TRIMESTRE", colSpan: 4 },
                { content: "TOTAL", rowSpan: 2 },
              ],
              [
                "1ère pér",
                "2è pér",
                "Ex",
                "PTS Obt",
                "3è pér",
                "4è pér",
                "Ex",
                "PTS Obt",
                "5è pér",
                "6è pér",
                "Ex",
                "PTS Obt",
              ],
            ]
          : undefined,
      body: tableData,
      theme: "grid",
      styles: { fontSize: 7, cellPadding: 1, halign: "center" },
      headStyles: {
        fillColor: [200, 200, 200],
        textColor: [0, 0, 0],
        fontStyle: "bold",
      },
      columnStyles: {
        0: { halign: "left", cellWidth: 35 },
        1: { cellWidth: 10 },
      },
      didParseCell: (data) => {
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [230, 230, 230];
        }
      },
    });

    startY = doc.lastAutoTable.finalY + 2;
  });

  // Total général
  const finalY = startY + 5;
  doc.setFillColor(200, 200, 200);
  doc.rect(10, finalY, pageWidth - 20, 10, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL GENERAL", 15, finalY + 7);
  doc.text(`${maxTotal}`, 50, finalY + 7);
  doc.text(`T1: ${totalGeneral.t1}`, 80, finalY + 7);
  doc.text(`T2: ${totalGeneral.t2}`, 120, finalY + 7);
  doc.text(`T3: ${totalGeneral.t3}`, 160, finalY + 7);
  doc.text(`ANNUEL: ${totalGeneral.annual}`, 200, finalY + 7);

  // Pourcentage
  const pourcentage = ((totalGeneral.annual / (maxTotal * 3)) * 100).toFixed(2);
  doc.text(`POURCENTAGE: ${pourcentage}%`, 15, finalY + 15);

  // Décision
  const decision = getDecision(parseFloat(pourcentage));
  doc.setFontSize(9);
  doc.text("DECISION:", pageWidth - 80, finalY + 5);
  doc.setFont("helvetica", "normal");

  // Checkboxes pour décision
  const checkBoxY = finalY + 10;
  doc.rect(pageWidth - 80, checkBoxY, 4, 4);
  doc.text("L'Élève passe en classe supérieure", pageWidth - 74, checkBoxY + 3);
  if (decision === "passe") {
    doc.text("X", pageWidth - 78, checkBoxY + 3);
  }

  doc.rect(pageWidth - 80, checkBoxY + 6, 4, 4);
  doc.text("L'Élève double la classe", pageWidth - 74, checkBoxY + 9);
  if (decision === "double") {
    doc.text("X", pageWidth - 78, checkBoxY + 9);
  }

  doc.rect(pageWidth - 80, checkBoxY + 12, 4, 4);
  doc.text("L'Élève a échoué", pageWidth - 74, checkBoxY + 15);
  if (decision === "echoue") {
    doc.text("X", pageWidth - 78, checkBoxY + 15);
  }

  // Signatures
  const signatureY = pageHeight - 20;
  doc.setFontSize(8);
  doc.text("LE DIRECTEUR", 30, signatureY);
  doc.line(20, signatureY + 10, 60, signatureY + 10);

  doc.text("PARENT", pageWidth / 2, signatureY, { align: "center" });
  doc.line(
    pageWidth / 2 - 20,
    signatureY + 10,
    pageWidth / 2 + 20,
    signatureY + 10,
  );

  doc.text("ENSEIGNANT", pageWidth - 40, signatureY);
  doc.line(pageWidth - 60, signatureY + 10, pageWidth - 20, signatureY + 10);

  // Pied de page
  doc.setFontSize(7);
  doc.text(
    `Fait à Kinshasa, le ${formatDate(new Date().toISOString().split("T")[0])}`,
    pageWidth - 50,
    pageHeight - 5,
  );

  // Télécharger
  doc.save(
    `Bulletin_${student.lastName}_${student.firstName}_${academicYear}.pdf`,
  );
};

// Générer rapport annuel avec graphiques
export const generateAnnualReportPDF = async (
  student: Student,
  grades: Grade[],
  academicYear: string,
  schoolName: string,
): Promise<void> => {
  const doc = new jsPDF() as jsPDFWithAutoTable;
  const pageWidth = doc.internal.pageSize.getWidth();
  const className =
    typeof student.class === "object" ? student.class?.name : "N/A";

  // En-tête
  doc.setFillColor(41, 128, 185);
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(schoolName, pageWidth / 2, 15, { align: "center" });

  doc.setFontSize(14);
  doc.text("RAPPORT ANNUEL DE PERFORMANCES", pageWidth / 2, 25, {
    align: "center",
  });

  doc.setFontSize(10);
  doc.text(`Année scolaire: ${academicYear}`, pageWidth / 2, 35, {
    align: "center",
  });

  // Informations élève
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("INFORMATIONS DE L'ÉLÈVE", 14, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Nom et Prénom: ${student.lastName} ${student.firstName}`, 14, 58);
  doc.text(`Matricule: ${student.matricule}`, 14, 64);
  doc.text(`Classe: ${className}`, 14, 70);
  doc.text(`Date de naissance: ${formatDate(student.dateOfBirth)}`, 110, 58);

  // Calculer moyennes par trimestre
  const t1Grades = grades.filter((g) => g.trimester === 1);
  const t2Grades = grades.filter((g) => g.trimester === 2);
  const t3Grades = grades.filter((g) => g.trimester === 3);

  const t1Avg = calculateAverage(t1Grades);
  const t2Avg = calculateAverage(t2Grades);
  const t3Avg = calculateAverage(t3Grades);
  const annualAvg = (t1Avg + t2Avg + t3Avg) / 3;

  // Tableau récapitulatif
  autoTable(doc, {
    startY: 80,
    head: [["Trimestre", "Moyenne", "Mention", "Classement"]],
    body: [
      ["1er Trimestre", t1Avg.toFixed(2), getMentionText(t1Avg), "N/A"],
      ["2ème Trimestre", t2Avg.toFixed(2), getMentionText(t2Avg), "N/A"],
      ["3ème Trimestre", t3Avg.toFixed(2), getMentionText(t3Avg), "N/A"],
      [
        "MOYENNE ANNUELLE",
        annualAvg.toFixed(2),
        getMentionText(annualAvg),
        "N/A",
      ],
    ],
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
    bodyStyles: { halign: "center" },
    didParseCell: (data) => {
      if (data.row.index === 3) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [240, 240, 240];
      }
    },
  });

  // Graphique d'évolution (simulation visuelle)
  const graphY = 130;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("ÉVOLUTION DES PERFORMANCES", 14, graphY);

  // Axes du graphique
  const graphX = 20;
  const graphWidth = 170;
  const graphHeight = 60;

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(
    graphX,
    graphY + graphHeight + 10,
    graphX + graphWidth,
    graphY + graphHeight + 10,
  ); // Axe X
  doc.line(graphX, graphY + 10, graphX, graphY + graphHeight + 10); // Axe Y

  // Échelle Y (0-20)
  doc.setFontSize(7);
  for (let i = 0; i <= 20; i += 5) {
    const yPos = graphY + graphHeight + 10 - (i / 20) * graphHeight;
    doc.text(i.toString(), graphX - 8, yPos + 2);
    doc.setDrawColor(200);
    doc.line(graphX, yPos, graphX + graphWidth, yPos);
  }

  // Points et lignes
  const points = [
    {
      x: graphX + 40,
      y: graphY + graphHeight + 10 - (t1Avg / 20) * graphHeight,
      label: "T1",
    },
    {
      x: graphX + 90,
      y: graphY + graphHeight + 10 - (t2Avg / 20) * graphHeight,
      label: "T2",
    },
    {
      x: graphX + 140,
      y: graphY + graphHeight + 10 - (t3Avg / 20) * graphHeight,
      label: "T3",
    },
  ];

  // Dessiner les lignes
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(1);
  for (let i = 0; i < points.length - 1; i++) {
    doc.line(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
  }

  // Dessiner les points
  doc.setFillColor(41, 128, 185);
  points.forEach((point) => {
    doc.circle(point.x, point.y, 3, "F");
    doc.setFontSize(8);
    doc.text(point.label, point.x - 3, graphY + graphHeight + 18);
    doc.text(t1Avg.toFixed(1), point.x - 5, point.y - 5);
  });

  // Décision finale
  const decisionY = graphY + graphHeight + 35;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("DÉCISION DU CONSEIL DE CLASSE", 14, decisionY);

  const decision =
    annualAvg >= 10 ? "ADMIS(E) EN CLASSE SUPÉRIEURE" : "REDOUBLEMENT";
  const decisionColor = annualAvg >= 10 ? [39, 174, 96] : [231, 76, 60];

  doc.setFillColor(decisionColor[0], decisionColor[1], decisionColor[2]);
  doc.roundedRect(14, decisionY + 5, 80, 10, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text(decision, 54, decisionY + 12, { align: "center" });

  // Signature
  doc.setTextColor(0, 0, 0);
  const signatureY = decisionY + 30;
  doc.setFont("helvetica", "normal");
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
    "Ce rapport est un document officiel. Toute falsification est passible de poursuites.",
    pageWidth / 2,
    285,
    { align: "center" },
  );

  doc.save(
    `Rapport_Annuel_${student.lastName}_${student.firstName}_${academicYear}.pdf`,
  );
};

// Helpers
const organizeTrimesterGrades = (grades: Grade[]): TrimesterGrades => {
  const result: TrimesterGrades = {};

  grades.forEach((grade) => {
    const subject =
      typeof grade.subjectId === "object" ? grade.subjectId : null;
    if (!subject) return;

    const subjectName = subject.name;
    if (!result[subjectName]) {
      result[subjectName] = {
        t1: { eval1: null, eval2: null, exam: null, total: null },
        t2: { eval1: null, eval2: null, exam: null, total: null },
        t3: { eval1: null, eval2: null, exam: null, total: null },
        annualTotal: null,
        maxPoints: (subject.coefficient || 1) * 5,
      };
    }

    const trimesterKey = `t${grade.trimester}` as "t1" | "t2" | "t3";
    result[subjectName][trimesterKey] = {
      eval1: grade.interrogation1,
      eval2: grade.interrogation2,
      exam: grade.examen,
      total: grade.moyenne,
    };
  });

  // Calculer totaux annuels
  Object.keys(result).forEach((subjectName) => {
    const data = result[subjectName];
    const t1 = data.t1.total || 0;
    const t2 = data.t2.total || 0;
    const t3 = data.t3.total || 0;
    data.annualTotal = t1 + t2 + t3;
  });

  return result;
};

const calculateAverage = (grades: Grade[]): number => {
  if (grades.length === 0) return 0;
  let totalPoints = 0;
  let totalCoeff = 0;

  grades.forEach((grade) => {
    const subject =
      typeof grade.subjectId === "object" ? grade.subjectId : null;
    if (subject && grade.moyenne !== null) {
      totalPoints += grade.moyenne * (subject.coefficient || 1);
      totalCoeff += subject.coefficient || 1;
    }
  });

  return totalCoeff > 0 ? totalPoints / totalCoeff : 0;
};

const getMentionText = (moyenne: number): string => {
  if (moyenne >= 16) return "Très Bien";
  if (moyenne >= 14) return "Bien";
  if (moyenne >= 12) return "Assez Bien";
  if (moyenne >= 10) return "Passable";
  return "Insuffisant";
};

const getDecision = (pourcentage: number): "passe" | "double" | "echoue" => {
  if (pourcentage >= 50) return "passe";
  if (pourcentage >= 40) return "double";
  return "echoue";
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};
