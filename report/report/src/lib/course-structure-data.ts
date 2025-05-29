// src/lib/course-structure-data.ts

export interface SubjectStructure {
  [category: string]: {
    [combination: string]: string[];
  };
}

export const subjectData: SubjectStructure = {
  "General Education": {
    MCB: ["Mathematics", "Chemistry", "Biology"],
    MPC: ["Mathematics", "Physics", "Chemistry"],
    HEG: ["History", "Economics", "Geography"],
    SACI: ["Social Anthropology", "Communication Skills", "ICT"],
    LFK: ["Literature", "French", "Kinyarwanda"],
  },
  TVET: {
    Accountancy: ["Financial Accounting", "Taxation", "Cost Accounting"],
    Construction: ["Technical Drawing", "Surveying", "Construction Tech"],
    "Culinary Arts": ["Food Production", "Nutrition", "Food Hygiene"],
    "Software Development": ["Programming", "Web Development", "Databases"],
  },
};

export const categories = Object.keys(subjectData);

export const getCombinationsForCategory = (category: string): string[] => {
  if (subjectData[category]) {
    return Object.keys(subjectData[category]);
  }
  return [];
};

// This function is not strictly needed if subjects are managed in Firestore
// but can be useful for validation or initial population if needed.
export const getSubjectsForCombination = (category: string, combination: string): string[] => {
  if (subjectData[category] && subjectData[category][combination]) {
    return subjectData[category][combination];
  }
  return [];
};
