export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface CategoryMeta {
  timeMinutes: number;
  total: number;
}

export interface TestData {
  logical: Question[];
  quantitative: Question[];
  technical: Question[];
  verbal: Question[];
}

export const categoryMeta: Record<string, CategoryMeta> = {
  logical: { timeMinutes: 30, total: 20 },
  quantitative: { timeMinutes: 30, total: 20 },
  technical: { timeMinutes: 30, total: 20 },
  verbal: { timeMinutes: 30, total: 20 },
};

// Sample questions for each category
const generateLogicalQuestions = (): Question[] => {
  const questions: Question[] = [
    {
      id: 1,
      question: "If all roses are flowers and some flowers fade quickly, then:",
      options: [
        "All roses fade quickly",
        "Some roses fade quickly",
        "No roses fade quickly",
        "Cannot be determined"
      ],
      correctAnswer: 3
    },
    {
      id: 2,
      question: "Complete the series: 2, 6, 12, 20, 30, ?",
      options: ["40", "42", "44", "46"],
      correctAnswer: 1
    },
    {
      id: 3,
      question: "If Monday is the first day, what day is the 100th day?",
      options: ["Monday", "Tuesday", "Wednesday", "Thursday"],
      correctAnswer: 1
    },
    {
      id: 4,
      question: "All dogs are animals. Some animals are pets. Therefore:",
      options: [
        "All dogs are pets",
        "Some dogs are pets",
        "No dogs are pets",
        "Cannot be determined"
      ],
      correctAnswer: 3
    },
    {
      id: 5,
      question: "If A > B and B > C, then:",
      options: ["A > C", "C > A", "A = C", "Cannot be determined"],
      correctAnswer: 0
    }
  ];

  // Generate remaining questions to reach 20
  for (let i = 6; i <= 20; i++) {
    questions.push({
      id: i,
      question: `Logical reasoning question ${i}. This is a sample question for testing purposes.`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: (i - 1) % 4
    });
  }

  return questions;
};

const generateQuantitativeQuestions = (): Question[] => {
  const questions: Question[] = [
    {
      id: 1,
      question: "What is 15% of 240?",
      options: ["30", "36", "40", "45"],
      correctAnswer: 1
    },
    {
      id: 2,
      question: "If x + 5 = 12, what is x?",
      options: ["5", "7", "12", "17"],
      correctAnswer: 1
    },
    {
      id: 3,
      question: "What is the area of a circle with radius 5?",
      options: ["10π", "25π", "50π", "100π"],
      correctAnswer: 1
    },
    {
      id: 4,
      question: "If a train travels 120 km in 2 hours, what is its speed?",
      options: ["50 km/h", "60 km/h", "70 km/h", "80 km/h"],
      correctAnswer: 1
    },
    {
      id: 5,
      question: "What is 2³ × 3²?",
      options: ["36", "54", "72", "108"],
      correctAnswer: 2
    }
  ];

  for (let i = 6; i <= 20; i++) {
    questions.push({
      id: i,
      question: `Quantitative question ${i}. Solve this mathematical problem.`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: (i - 1) % 4
    });
  }

  return questions;
};

const generateTechnicalQuestions = (): Question[] => {
  const questions: Question[] = [
    {
      id: 1,
      question: "What is the time complexity of binary search?",
      options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
      correctAnswer: 1
    },
    {
      id: 2,
      question: "Which data structure follows LIFO principle?",
      options: ["Queue", "Stack", "Array", "Linked List"],
      correctAnswer: 1
    },
    {
      id: 3,
      question: "What does SQL stand for?",
      options: [
        "Structured Query Language",
        "Simple Query Language",
        "Standard Query Language",
        "System Query Language"
      ],
      correctAnswer: 0
    },
    {
      id: 4,
      question: "What is the default port for HTTP?",
      options: ["80", "443", "8080", "3000"],
      correctAnswer: 0
    },
    {
      id: 5,
      question: "Which is not a programming paradigm?",
      options: ["Object-Oriented", "Functional", "Procedural", "Linear"],
      correctAnswer: 3
    }
  ];

  for (let i = 6; i <= 20; i++) {
    questions.push({
      id: i,
      question: `Technical question ${i}. This tests your technical knowledge.`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: (i - 1) % 4
    });
  }

  return questions;
};

const generateVerbalQuestions = (): Question[] => {
  const questions: Question[] = [
    {
      id: 1,
      question: "What is the synonym of 'Benevolent'?",
      options: ["Kind", "Hostile", "Indifferent", "Angry"],
      correctAnswer: 0
    },
    {
      id: 2,
      question: "Choose the correct sentence:",
      options: [
        "The team are playing well",
        "The team is playing well",
        "The team were playing well",
        "The team be playing well"
      ],
      correctAnswer: 1
    },
    {
      id: 3,
      question: "What does 'Ephemeral' mean?",
      options: ["Lasting", "Temporary", "Permanent", "Eternal"],
      correctAnswer: 1
    },
    {
      id: 4,
      question: "Fill in the blank: She is _____ intelligent than her sister.",
      options: ["more", "most", "much", "many"],
      correctAnswer: 0
    },
    {
      id: 5,
      question: "What is the antonym of 'Eloquent'?",
      options: ["Articulate", "Fluent", "Inarticulate", "Expressive"],
      correctAnswer: 2
    }
  ];

  for (let i = 6; i <= 20; i++) {
    questions.push({
      id: i,
      question: `Verbal question ${i}. This tests your language skills.`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: (i - 1) % 4
    });
  }

  return questions;
};

export const testData: TestData = {
  logical: generateLogicalQuestions(),
  quantitative: generateQuantitativeQuestions(),
  technical: generateTechnicalQuestions(),
  verbal: generateVerbalQuestions(),
};

