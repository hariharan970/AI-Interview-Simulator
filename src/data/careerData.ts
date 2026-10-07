export interface Career {
  id: string;
  title: string;
  description: string;
  category: string;
  workStyle: string[];
  requiredTechSkills: number;
  requiredCommSkills: number;
}

export const careers: Career[] = [
  {
    id: "software-engineer",
    title: "Software Engineer",
    category: "tech",
    description: "Design and develop software applications, systems, and solutions.",
    workStyle: ["mixed", "remote"],
    requiredTechSkills: 9,
    requiredCommSkills: 6,
  },
  {
    id: "data-scientist",
    title: "Data Scientist",
    category: "tech",
    description: "Analyze complex data to extract insights and build predictive models.",
    workStyle: ["mixed", "remote"],
    requiredTechSkills: 9,
    requiredCommSkills: 7,
  },
  {
    id: "product-manager",
    title: "Product Manager",
    category: "tech",
    description: "Lead product development and strategy, bridging technical and business teams.",
    workStyle: ["mixed", "office"],
    requiredTechSkills: 7,
    requiredCommSkills: 9,
  },
  {
    id: "ux-designer",
    title: "UX Designer",
    category: "creative",
    description: "Create user-centered designs for digital products and experiences.",
    workStyle: ["mixed", "remote"],
    requiredTechSkills: 6,
    requiredCommSkills: 8,
  },
  {
    id: "devops-engineer",
    title: "DevOps Engineer",
    category: "tech",
    description: "Manage infrastructure, automation, and deployment pipelines.",
    workStyle: ["mixed", "remote"],
    requiredTechSkills: 9,
    requiredCommSkills: 6,
  },
  {
    id: "project-manager",
    title: "Project Manager",
    category: "business",
    description: "Plan, execute, and deliver projects on time and within budget.",
    workStyle: ["office", "mixed"],
    requiredTechSkills: 5,
    requiredCommSkills: 9,
  },
  {
    id: "business-analyst",
    title: "Business Analyst",
    category: "business",
    description: "Analyze business processes and recommend improvements.",
    workStyle: ["office", "mixed"],
    requiredTechSkills: 6,
    requiredCommSkills: 8,
  },
  {
    id: "marketing-manager",
    title: "Marketing Manager",
    category: "business",
    description: "Develop and execute marketing strategies to promote products.",
    workStyle: ["office", "mixed"],
    requiredTechSkills: 5,
    requiredCommSkills: 9,
  },
  {
    id: "research-scientist",
    title: "Research Scientist",
    category: "science",
    description: "Conduct research and experiments to advance scientific knowledge.",
    workStyle: ["office", "mixed"],
    requiredTechSkills: 8,
    requiredCommSkills: 7,
  },
  {
    id: "clinical-psychologist",
    title: "Clinical Psychologist",
    category: "health",
    description: "Provide mental health services and psychological assessments.",
    workStyle: ["office", "mixed"],
    requiredTechSkills: 4,
    requiredCommSkills: 10,
  },
  {
    id: "graphic-designer",
    title: "Graphic Designer",
    category: "creative",
    description: "Create visual concepts and designs for various media.",
    workStyle: ["mixed", "remote"],
    requiredTechSkills: 7,
    requiredCommSkills: 7,
  },
  {
    id: "data-analyst",
    title: "Data Analyst",
    category: "tech",
    description: "Interpret data and provide insights to support business decisions.",
    workStyle: ["mixed", "remote"],
    requiredTechSkills: 8,
    requiredCommSkills: 7,
  },
];

export interface AssessmentData {
  interests: string;
  workStyle: string;
  techSkills: number;
  commSkills: number;
}

export function calculateMatch(
  career: Career,
  assessment: AssessmentData
): number {
  let match = 0;

  // Interest match (40% weight)
  if (career.category === assessment.interests) {
    match += 40;
  } else {
    match += 10; // Partial match
  }

  // Work style match (20% weight)
  if (career.workStyle.includes(assessment.workStyle)) {
    match += 20;
  } else {
    match += 5; // Partial match
  }

  // Tech skills match (25% weight)
  const techDiff = Math.abs(career.requiredTechSkills - assessment.techSkills);
  const techMatch = Math.max(0, 25 - (techDiff * 3));
  match += techMatch;

  // Communication skills match (15% weight)
  const commDiff = Math.abs(career.requiredCommSkills - assessment.commSkills);
  const commMatch = Math.max(0, 15 - (commDiff * 2));
  match += commMatch;

  return Math.min(100, Math.round(match));
}

