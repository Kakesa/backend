export interface SubjectConfig {
  name: string;
  maxPoints: number;
  code?: string; // Matching code (e.g. 'MATH', 'FR')
}

export interface BranchConfig {
  name: string;
  maxPoints: number;
  subjects: SubjectConfig[];
}

export interface BulletinFormatConfig {
  id: string;
  name: string;
  schoolType: "primary" | "secondary";
  levels: number[]; // e.g., [1, 2] for Elementary
  options?: string[]; // e.g., ["Scientifique"]
  branches: BranchConfig[];
}

export const primaryElementary: BulletinFormatConfig = {
  id: "primary-elementary",
  name: "Degré Élémentaire (1e/2e)",
  schoolType: "primary",
  levels: [1, 2],
  branches: [
    {
      name: "LANGUE NATIONALE",
      maxPoints: 80,
      subjects: [
        { name: "Expression Orale", maxPoints: 20, code: "LN_ORALE" },
        { name: "Lecture", maxPoints: 20, code: "LN_LECT" },
        { name: "Ecriture", maxPoints: 20, code: "LN_ECR" },
        { name: "Production d'écrits", maxPoints: 20, code: "LN_PROD" },
      ],
    },
    {
      name: "FRANCAIS",
      maxPoints: 80,
      subjects: [
        { name: "Expression Orale", maxPoints: 20, code: "FR_ORALE" },
        { name: "Lecture", maxPoints: 20, code: "FR_LECT" },
        { name: "Ecriture", maxPoints: 20, code: "FR_ECR" },
        { name: "Production d'écrits", maxPoints: 20, code: "FR_PROD" },
      ],
    },
    {
      name: "MATHEMATIQUE",
      maxPoints: 80,
      subjects: [
        { name: "Arithmétique", maxPoints: 20, code: "MATH_ARITH" },
        { name: "Grandeurs", maxPoints: 20, code: "MATH_GRAND" },
        { name: "Formes Géométriques", maxPoints: 20, code: "MATH_GEOM" },
        { name: "Problèmes", maxPoints: 20, code: "MATH_PROB" },
      ],
    },
    {
      name: "EVEIL SCIENTIFIQUE",
      maxPoints: 40,
      subjects: [
        { name: "Sciences", maxPoints: 20, code: "SCI" },
        { name: "Milieu", maxPoints: 20, code: "MILIEU" },
      ],
    },
    {
      name: "E.C.M",
      maxPoints: 20,
      subjects: [
        { name: "Education Civique et Morale", maxPoints: 20, code: "ECM" },
      ],
    },
    {
      name: "E.P.S",
      maxPoints: 20,
      subjects: [
        { name: "Education Physique et Sportive", maxPoints: 20, code: "EPS" },
      ],
    },
    {
      name: "ACTIVITES CREATRICES",
      maxPoints: 20,
      subjects: [
        { name: "Dessin, Chant, Travail Manuel", maxPoints: 20, code: "ARTS" },
      ],
    },
  ],
};

export const primaryMoyen: BulletinFormatConfig = {
  id: "primary-moyen",
  name: "Degré Moyen (3e/4e)",
  schoolType: "primary",
  levels: [3, 4],
  branches: [
    {
      name: "LANGUE NATIONALE",
      maxPoints: 100,
      subjects: [
        { name: "Expression Orale", maxPoints: 20 },
        { name: "Lecture/Compréhension", maxPoints: 30 },
        { name: "Ecriture", maxPoints: 20 },
        { name: "Production d'écrits", maxPoints: 30 },
      ],
    },
    {
      name: "FRANCAIS",
      maxPoints: 120,
      subjects: [
        { name: "Langage", maxPoints: 30 },
        { name: "Lecture", maxPoints: 30 },
        { name: "Ecriture", maxPoints: 20 },
        { name: "Production d'écrits", maxPoints: 40 },
      ],
    },
    {
      name: "MATHEMATIQUE",
      maxPoints: 120,
      subjects: [
        { name: "Arithmétique", maxPoints: 40, code: "MATH_ARITH" },
        { name: "Grandeurs", maxPoints: 30, code: "MATH_GRAND" },
        { name: "Géométrie", maxPoints: 30, code: "MATH_GEOM" },
        { name: "Problèmes", maxPoints: 20, code: "MATH_PROB" },
      ],
    },
    {
      name: "EVEIL SCIENTIFIQUE",
      maxPoints: 60,
      subjects: [
        { name: "Sciences de la Vie", maxPoints: 30 },
        { name: "Géographie", maxPoints: 15 },
        { name: "Histoire", maxPoints: 15 },
      ],
    },
    {
      name: "SOCIALE",
      maxPoints: 40,
      subjects: [
        { name: "E.C.M", maxPoints: 20 },
        { name: "Religion", maxPoints: 20 },
      ],
    },
    {
      name: "DIVERS",
      maxPoints: 40,
      subjects: [
        { name: "E.P.S", maxPoints: 20 },
        { name: "Esthétique/Travaux", maxPoints: 20 },
      ],
    },
  ],
};

export const primaryTerminal: BulletinFormatConfig = {
  id: "primary-terminal",
  name: "Degré Terminal (5e/6e)",
  schoolType: "primary",
  levels: [5, 6],
  branches: [
    {
      name: "FRANCAIS",
      maxPoints: 200,
      subjects: [
        { name: "Grammaire", maxPoints: 40 },
        { name: "Conjugaison", maxPoints: 40 },
        { name: "Orthographe", maxPoints: 40 },
        { name: "Lecture", maxPoints: 40 },
        { name: "Production d'écrits", maxPoints: 40 },
      ],
    },
    {
      name: "MATHEMATIQUE",
      maxPoints: 150,
      subjects: [
        { name: "Arithmétique", maxPoints: 50 },
        { name: "Système de Mesure", maxPoints: 40 },
        { name: "Géométrie", maxPoints: 30 },
        { name: "Problèmes", maxPoints: 30 },
      ],
    },
    {
      name: "CIENCES ET TECHNOLOGIES",
      maxPoints: 80,
      subjects: [
        { name: "Sciences", maxPoints: 50 },
        { name: "Technologie", maxPoints: 30 },
      ],
    },
    {
      name: "UNIVERS SOCIAL",
      maxPoints: 80,
      subjects: [
        { name: "Histoire", maxPoints: 30 },
        { name: "Géographie", maxPoints: 30 },
        { name: "E.C.M", maxPoints: 20 },
      ],
    },
    {
      name: "DIVERS",
      maxPoints: 60,
      subjects: [
        { name: "Dessin/Travaux", maxPoints: 20 },
        { name: "E.P.S", maxPoints: 20 },
        { name: "Chant/Musique", maxPoints: 20 },
      ],
    },
  ],
};

export const secondaryScientifique: BulletinFormatConfig = {
  id: "secondary-scientific",
  name: "Humanités Scientifiques",
  schoolType: "secondary",
  levels: [1, 2, 3, 4], // Using 1-4 for secondary years (7th-10th/1st-4th)
  options: ["Scientifique", "Sciences"],
  branches: [
    {
      name: "CULTURE GENERALE",
      maxPoints: 100,
      subjects: [
        { name: "Religion", maxPoints: 20, code: "REL" },
        { name: "Civisme", maxPoints: 20, code: "CIV" },
        { name: "Histoire", maxPoints: 30, code: "HIST" },
        { name: "Géographie", maxPoints: 30, code: "GEO" },
      ],
    },
    {
      name: "LANGUES",
      maxPoints: 150,
      subjects: [
        { name: "Français", maxPoints: 100, code: "FR" },
        { name: "Anglais", maxPoints: 50, code: "ANG" },
      ],
    },
    {
      name: "SCIENCES EXACTES",
      maxPoints: 300,
      subjects: [
        { name: "Mathématiques", maxPoints: 100, code: "MATH" },
        { name: "Physique", maxPoints: 100, code: "PHY" },
        { name: "Chimie", maxPoints: 50, code: "CHIMIE" },
        { name: "Biologie", maxPoints: 50, code: "SVT" },
      ],
    },
  ],
};

export const bulletinFormats: BulletinFormatConfig[] = [
  primaryElementary,
  primaryMoyen,
  primaryTerminal,
  secondaryScientifique,
  {
    id: "portrait-drc-semester",
    name: "Portrait Officiel 2 Semestres (RDC)",
    schoolType: "secondary",
    levels: [1, 2, 3, 4, 5, 6],
    branches: [],
  },
  {
    id: "portrait-drc-trimester",
    name: "Portrait Officiel 3 Trimestres (RDC)",
    schoolType: "primary",
    levels: [1, 2, 3, 4, 5, 6],
    branches: [],
  },
];

export const getFormatsForLevel = (
  schoolTypes: string,
  level: number,
  section?: string,
) => {
  if (!schoolTypes) {
    console.warn('schoolTypes is undefined in getFormatsForLevel');
    return [];
  }
  
  const types = schoolTypes.toLowerCase();

  return bulletinFormats.filter((format) => {
    // Check if school has this type
    if (!types.includes(format.schoolType)) return false;

    // Check if level matches
    if (!format.levels.includes(level)) return false;

    // For secondary, check if section (option) matches
    if (format.schoolType === "secondary" && section && format.options) {
      // Normalize comparison (DRC: "Scientifique" class usually in "Scientifique" option)
      return format.options.some((opt) =>
        section.toLowerCase().includes(opt.toLowerCase()),
      );
    }

    return true;
  });
};
