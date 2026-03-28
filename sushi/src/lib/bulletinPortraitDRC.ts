/* eslint-disable @typescript-eslint/no-explicit-any */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Student, Grade, Subject } from "@/types";
import { apiGetCurrentSchool } from "@/services/api/schools.api";

interface jsPDFWithAutoTable extends jsPDF {
    lastAutoTable: {
        finalY: number;
    };
}

export type PortraitLayoutType = "semester" | "trimester";

export interface PortraitDRCBulletinData {
    student: Student;
    grades: Grade[];
    subjects: Subject[];
    academicYear: string;
    // Les champs suivants seront récupérés dynamiquement depuis l'API
    schoolName?: string;
    schoolAddress?: string;
    schoolCode?: string;
    nPerm?: string;
    province?: string;
    schoolLogo?: string;
    layoutType?: PortraitLayoutType;
}

// --- Shared header rendering ---
const renderHeader = (
    doc: jsPDF,
    pageWidth: number,
    margin: number,
    data: PortraitDRCBulletinData,
    schoolInfo?: any
) => {
    const { student } = data;
    
    // Utiliser les infos de l'école depuis l'API avec fallback sur les données
    const schoolName = schoolInfo?.name || data.schoolName || "ÉCOLE";
    const schoolCode = schoolInfo?.code || data.schoolCode || "CODE";
    const province = schoolInfo?.province || data.province || "KINSHASA";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("REPUBLIQUE DEMOCRATIQUE DU CONGO", pageWidth / 2, 10, { align: "center" });
    doc.setFontSize(9);
    doc.text("MINISTERE DE L'ENSEIGNEMENT PRIMAIRE, SECONDAIRE", pageWidth / 2, 15, { align: "center" });
    doc.text("ET PROFESSIONNEL", pageWidth / 2, 19, { align: "center" });

    doc.rect(margin, 5, 20, 15);
    doc.text("DRC", margin + 10, 13, { align: "center" });
    doc.rect(pageWidth - margin - 20, 5, 20, 15);
    doc.text("MIN", pageWidth - margin - 10, 13, { align: "center" });

    doc.setFontSize(7);
    doc.text("N° ID", margin, 25);
    const idBoxWidth = 5;
    for (let i = 0; i < 25; i++) {
        doc.rect(margin + 8 + (i * idBoxWidth), 22, idBoxWidth, 4);
    }

    const gridY = 28;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    doc.text("PROVINCE :", margin, gridY + 4);
    doc.line(margin + 18, gridY + 4, margin + 80, gridY + 4);
    doc.text(province.toUpperCase(), margin + 20, gridY + 3.5);

    doc.text("VILLE :", margin, gridY + 9);
    doc.line(margin + 18, gridY + 9, margin + 40, gridY + 9);
    doc.text(schoolInfo?.city || "", margin + 20, gridY + 8.5);

    doc.text("ELEVE :", 110, gridY + 9);
    doc.line(125, gridY + 9, pageWidth - margin, gridY + 9);
    doc.text(`${student.lastName.toUpperCase()} ${student.firstName}`, 127, gridY + 8.5);

    doc.text("SEXE :", 185, gridY + 9, { align: "right" });
    doc.line(186, gridY + 9, pageWidth - margin, gridY + 9);
    doc.text(student.gender === "MALE" ? "M" : "F", 192, gridY + 8.5);

    doc.text("COMMUNE / TER (1) :", margin, gridY + 14);
    doc.line(margin + 32, gridY + 14, margin + 80, gridY + 14);
    doc.text(schoolInfo?.commune || "", margin + 34, gridY + 13.5);

    doc.text("NE (E) A :", 110, gridY + 14);
    doc.line(125, gridY + 14, 160, gridY + 14);
    doc.text(student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('fr-FR') : "", 127, gridY + 13.5);

    doc.text("LE :", 165, gridY + 14);
    doc.line(172, gridY + 14, pageWidth - margin, gridY + 14);
    doc.text(student.placeOfBirth || "", 174, gridY + 13.5);

    doc.text("ECOLE :", margin, gridY + 19);
    doc.line(margin + 18, gridY + 19, margin + 80, gridY + 19);
    doc.text(schoolName.toUpperCase(), margin + 20, gridY + 18.5);

    doc.text("CLASSE :", 110, gridY + 19);
    doc.line(125, gridY + 19, pageWidth - margin, gridY + 19);
    doc.text(typeof student.class === "object" ? student.class?.name || "" : "N/A", 127, gridY + 18.5);

    doc.text("CODE :", margin, gridY + 24);
    doc.line(margin + 18, gridY + 24, margin + 40, gridY + 24);
    doc.text(schoolCode, margin + 20, gridY + 23.5);

    doc.text("N° PERM :", 110, gridY + 24);
    for (let i = 0; i < 15; i++) {
        doc.rect(125 + (i * 4), gridY + 21, 4, 4);
    }

    const titleY = gridY + 28;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, titleY, pageWidth - (margin * 2), 5, "F");
    doc.text(`BULLETIN DE L'ANNEE SCOLAIRE ${data.academicYear}`, pageWidth / 2, titleY + 3.5, { align: "center" });

    return titleY;
};

// --- Footer rendering ---
const renderFooter = (doc: jsPDF, finalY: number, margin: number, pageWidth: number, student: Student) => {
    doc.setFontSize(8);
    doc.text("- L'élève ne pourra passer dans la classe supérieure s'il n'a subi avec succès un examen de repêchage en : .............................", margin, finalY);
    doc.text("..................................................................................................................................................................................................", margin, finalY + 5);

    doc.text("Fait à ...................................... Le ...... / ...... / 20 ....", pageWidth - margin, finalY + 15, { align: "right" });
    doc.text("Le Chef d'Etablissement", pageWidth - margin - 15, finalY + 20, { align: "right" });
    doc.text("Sceau de l'école", margin + 15, finalY + 20);

    doc.text("Signature de l'élève", margin + 15, finalY + 40);
    doc.text("Nom et Signature", pageWidth - margin - 15, finalY + 40, { align: "right" });
};

// --- Group grades by domain & subject ---
const getEntityId = (value: unknown) => {
    if (!value || typeof value !== "object") return typeof value === "string" ? value : "";
    const entity = value as { id?: string; _id?: string };
    return entity.id || entity._id || "";
};

const getResolvedSubjects = (grades: Grade[], subjects: Subject[]) => {
    const subjectMap = new Map<string, Subject>();

    subjects.forEach((subject) => {
        const subjectId = getEntityId(subject);
        if (subjectId) {
            subjectMap.set(subjectId, subject);
        }
    });

    grades.forEach((grade) => {
        if (typeof grade.subjectId === "object" && grade.subjectId) {
            const subject = grade.subjectId as Subject & { _id?: string };
            const subjectId = getEntityId(subject);
            if (subjectId && !subjectMap.has(subjectId)) {
                subjectMap.set(subjectId, {
                    ...subject,
                    id: subject.id || subject._id || subjectId,
                });
            }
        }
    });

    return subjectMap;
};

const groupGradesByDomain = (grades: Grade[], subjects: Subject[]) => {
    const subjectMapById = getResolvedSubjects(grades, subjects);
    const domains = new Map<string, Map<string, { subject: Subject; grades: Record<number, Grade> }>>();

    grades.forEach(g => {
        const subId = getEntityId(g.subjectId);
        const subject = subjectMapById.get(subId);
        if (!subject || !subId) return;

        const domainName = (subject as any).domaine || "AUTRES BRANCHES";
        if (!domains.has(domainName)) domains.set(domainName, new Map());

        const subjectMap = domains.get(domainName)!;
        if (!subjectMap.has(subId)) {
            subjectMap.set(subId, { subject, grades: {} });
        }
        subjectMap.get(subId)!.grades[g.trimester] = g;
    });

    return domains;
};

// --- Calculate TJ + Exam totals ---
const calcPeriodTotals = (g: Grade | undefined) => {
    if (!g) return { tj: 0, exam: 0, tot: 0 };
    const tj = (g.interrogation1 || 0) + (g.interrogation2 || 0) + (g.devoir || 0);
    const exam = (g.examen || 0) * 2; // Points d'examen multipliés par 2
    const tot = g.moyenne ?? (tj + exam);
    return { tj, exam, tot };
};

// ========== SEMESTER LAYOUT (2 periods) ==========
const buildSemesterTable = (domains: ReturnType<typeof groupGradesByDomain>) => {
    const headers = [
        [
            { content: "BRANCHE", rowSpan: 2 },
            { content: "PREMIER SEMESTRE", colSpan: 4 },
            { content: "SECOND SEMESTRE", colSpan: 4 },
            { content: "T.G.", rowSpan: 2 },
            { content: "EXAMEN DE REPECHAGE", rowSpan: 2 }
        ],
        ["MAX", "T.J.", "EXAM", "TOT", "MAX", "T.J.", "EXAM", "TOT"]
    ];

    const tableRows: any[] = [];
    let totalMaxGeneral = 0, totalT1 = 0, totalT2 = 0;

    domains.forEach((subjectMap, domainName) => {
        tableRows.push([
            { content: domainName.toUpperCase(), colSpan: 11, styles: { fillColor: [240, 240, 240], fontStyle: "bold", halign: "center" } }
        ]);

        let domainMax = 0, domainTotalT1 = 0, domainTotalT2 = 0;

        subjectMap.forEach(({ subject, grades: subjectGrades }) => {
            const max = subject.coefficient || 20;
            const p1 = calcPeriodTotals(subjectGrades[1]);
            const p2 = calcPeriodTotals(subjectGrades[2]);

            tableRows.push([
                subject.name,
                max.toString(),
                p1.tj > 0 ? p1.tj.toString() : "",
                p1.exam > 0 ? p1.exam.toString() : "",
                p1.tot > 0 ? p1.tot.toString() : "",
                max.toString(),
                p2.tj > 0 ? p2.tj.toString() : "",
                p2.exam > 0 ? p2.exam.toString() : "",
                p2.tot > 0 ? p2.tot.toString() : "",
                (p1.tot + p2.tot) > 0 ? (p1.tot + p2.tot).toString() : "",
                ""
            ]);

            domainMax += max;
            domainTotalT1 += p1.tot;
            domainTotalT2 += p2.tot;
        });

        tableRows.push([
            { content: "SOUS-TOTAL", styles: { fontStyle: "bold", fillColor: [250, 250, 250] } },
            domainMax.toString(), "", "", domainTotalT1.toString(),
            domainMax.toString(), "", "", domainTotalT2.toString(),
            (domainTotalT1 + domainTotalT2).toString(), ""
        ]);

        totalMaxGeneral += domainMax;
        totalT1 += domainTotalT1;
        totalT2 += domainTotalT2;
    });

    const totalAnnual = totalT1 + totalT2;
    tableRows.push([
        { content: "MAXIMA GENERAUX", styles: { fontStyle: "bold", fillColor: [230, 230, 230] } },
        totalMaxGeneral.toString(), "", "", totalT1.toString(),
        totalMaxGeneral.toString(), "", "", totalT2.toString(),
        totalAnnual.toString(), ""
    ]);

    return { headers, tableRows };
};

// ========== TRIMESTER LAYOUT (3 periods) ==========
const buildTrimesterTable = (domains: ReturnType<typeof groupGradesByDomain>) => {
    const headers = [
        [
            { content: "BRANCHE", rowSpan: 2 },
            { content: "1er TRIMESTRE", colSpan: 7 },
            { content: "2ème TRIMESTRE", colSpan: 7 },
            { content: "3ème TRIMESTRE", colSpan: 7 },
            { content: "TOTAL ANNUEL", colSpan: 2 },
        ],
        [
            "Max\nPér.", "1ère\nPér.", "2ème\nPér.", "Max\nExam.", "PTS\nObt.\nd'Exam.", "Max\nTrim", "PTS\nObt.\nTrim.",
            "Max\nPér.", "3ème\nPér.", "4ème\nPér.", "Max\nExam.", "PTS\nObt.\nd'Exam.", "Max\nTrim", "PTS\nObt.\nTrim.",
            "Max\nPér.", "5ème\nPér.", "6ème\nPér.", "Max\nExam.", "PTS\nObt.\nd'Exam.", "Max\nTrim", "PTS\nObt.\nTrim.",
            "PTS\nTotal", "Obtention",
        ]
    ];

    const tableRows: any[] = [];
    let totalMaxGeneral = 0, totalT1 = 0, totalT2 = 0, totalT3 = 0;

    domains.forEach((subjectMap, domainName) => {
        tableRows.push([
            { content: domainName.toUpperCase(), colSpan: 23, styles: { fillColor: [240, 240, 240], fontStyle: "bold", halign: "center" } }
        ]);

        let domainMax = 0, dT1 = 0, dT2 = 0, dT3 = 0;

        subjectMap.forEach(({ subject, grades: subjectGrades }) => {
            const maxPeriode = subject.coefficient || 20;
            const maxExam = maxPeriode * 2;
            const maxTrim = maxExam * 2;
            
            // 1er Trimestre - Périodes 1 et 2
            const p1_interro1 = subjectGrades[1]?.interrogation1 || 0;
            const p1_interro2 = subjectGrades[1]?.interrogation2 || 0;
            const p1_exam = (subjectGrades[1]?.examen || 0) * 2; // Points d'examen multipliés par 2
            const p1_total = p1_interro1 + p1_interro2 + p1_exam;
            
            // 2ème Trimestre - Périodes 3 et 4
            const p2_interro1 = subjectGrades[2]?.interrogation1 || 0;
            const p2_interro2 = subjectGrades[2]?.interrogation2 || 0;
            const p2_exam = (subjectGrades[2]?.examen || 0) * 2; // Points d'examen multipliés par 2
            const p2_total = p2_interro1 + p2_interro2 + p2_exam;
            
            // 3ème Trimestre - Périodes 5 et 6
            const p3_interro1 = subjectGrades[3]?.interrogation1 || 0;
            const p3_interro2 = subjectGrades[3]?.interrogation2 || 0;
            const p3_exam = (subjectGrades[3]?.examen || 0) * 2; // Points d'examen multipliés par 2
            const p3_trimester_total = p3_interro1 + p3_interro2 + p3_exam;
            
            const annualTotal = p1_total + p2_total + p3_trimester_total;
            const annualMax = maxTrim * 3;

            tableRows.push([
                subject.name,
                maxPeriode.toString(),
                p1_interro1.toString(),
                p1_interro2.toString(),
                maxExam.toString(),
                p1_exam.toString(),
                maxTrim.toString(),
                p1_total.toString(),
                maxPeriode.toString(),
                p2_interro1.toString(),
                p2_interro2.toString(),
                maxExam.toString(),
                p2_exam.toString(),
                maxTrim.toString(),
                p2_total.toString(),
                maxPeriode.toString(),
                p3_interro1.toString(),
                p3_interro2.toString(),
                maxExam.toString(),
                p3_exam.toString(),
                maxTrim.toString(),
                p3_trimester_total.toString(),
                annualMax.toString(),
                annualTotal.toString(),
            ]);

            domainMax += maxPeriode;
            dT1 += p1_total;
            dT2 += p2_total;
            dT3 += p3_trimester_total;
        });

        tableRows.push([
            { content: "SOUS-TOTAL", styles: { fontStyle: "bold", fillColor: [250, 250, 250] } },
            domainMax.toString(), "", "", (domainMax * 2).toString(), "", (domainMax * 4).toString(), dT1.toString(),
            domainMax.toString(), "", "", (domainMax * 2).toString(), "", (domainMax * 4).toString(), dT2.toString(),
            domainMax.toString(), "", "", (domainMax * 2).toString(), "", (domainMax * 4).toString(), dT3.toString(),
            (domainMax * 12).toString(), (dT1 + dT2 + dT3).toString(),
        ]);

        totalMaxGeneral += domainMax;
        totalT1 += dT1;
        totalT2 += dT2;
        totalT3 += dT3;
    });

    const totalAnnual = totalT1 + totalT2 + totalT3;
    tableRows.push([
        { content: "MAXIMA GENERAUX", styles: { fontStyle: "bold", fillColor: [230, 230, 230] } },
        totalMaxGeneral.toString(), "", "", (totalMaxGeneral * 2).toString(), "", (totalMaxGeneral * 4).toString(), totalT1.toString(),
        totalMaxGeneral.toString(), "", "", (totalMaxGeneral * 2).toString(), "", (totalMaxGeneral * 4).toString(), totalT2.toString(),
        totalMaxGeneral.toString(), "", "", (totalMaxGeneral * 2).toString(), "", (totalMaxGeneral * 4).toString(), totalT3.toString(),
        (totalMaxGeneral * 12).toString(), totalAnnual.toString(),
    ]);

    return { headers, tableRows };
};

// ========== MAIN EXPORT ==========
export const generatePortraitDRCBulletin = async (data: PortraitDRCBulletinData) => {
    const layoutType: PortraitLayoutType = data.layoutType || "semester";

    // Récupérer les informations de l'école depuis l'API
    let schoolInfo = null;
    try {
        schoolInfo = await apiGetCurrentSchool();
        console.log("School info loaded:", schoolInfo);
    } catch (error) {
        console.warn("Failed to load school info, using fallback values:", error);
    }

    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    }) as jsPDFWithAutoTable;

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;

    const titleY = renderHeader(doc, pageWidth, margin, data, schoolInfo);

    const domains = groupGradesByDomain(data.grades, data.subjects);

    const { headers, tableRows } = layoutType === "trimester"
        ? buildTrimesterTable(domains)
        : buildSemesterTable(domains);

    const isTrimester = layoutType === "trimester";
    autoTable(doc, {
        startY: titleY + 7,
        head: headers,
        body: tableRows,
        theme: "grid",
        styles: {
            fontSize: isTrimester ? 4.8 : 7,
            cellPadding: isTrimester ? 0.5 : 1,
            halign: "center",
            valign: "middle",
            lineWidth: 0.1,
            minCellHeight: isTrimester ? 3.5 : 5,
        },
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            lineWidth: 0.15,
            fontStyle: "bold",
            fontSize: isTrimester ? 4.5 : 7,
            minCellHeight: isTrimester ? 6 : 8,
        },
        columnStyles: isTrimester ? {
            0: { halign: "left", cellWidth: 22 },
            1: { cellWidth: 5 }, 2: { cellWidth: 5 }, 3: { cellWidth: 5 },
            4: { cellWidth: 5 }, 5: { cellWidth: 7 }, 6: { cellWidth: 7 },
            7: { cellWidth: 5 }, 8: { cellWidth: 5 }, 9: { cellWidth: 5 },
            10: { cellWidth: 5 }, 11: { cellWidth: 7 }, 12: { cellWidth: 7 },
            13: { cellWidth: 5 }, 14: { cellWidth: 5 }, 15: { cellWidth: 5 },
            16: { cellWidth: 5 }, 17: { cellWidth: 7 }, 18: { cellWidth: 7 },
            19: { cellWidth: 7 }, 20: { cellWidth: 7 },
        } : {
            0: { halign: "left", cellWidth: 40 },
        },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    renderFooter(doc, finalY, margin, pageWidth, data.student);

    // Utiliser le nom de l'école depuis l'API si disponible
    const schoolName = schoolInfo?.name || data.schoolName || "ECOLE";
    doc.save(`Bulletin_Portrait_${schoolName}_${data.student.lastName}_${data.student.firstName}.pdf`);
};
