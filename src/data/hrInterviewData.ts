export interface InterviewCategory {
  id: string;
  name: string;
  type: string;
  difficulty: string;
  duration: number; // in minutes
  questions: string[];
}

export const interviewCategories: InterviewCategory[] = [
  {
    id: "behavioral",
    name: "Behavioral Interview",
    type: "HR",
    difficulty: "Medium",
    duration: 30,
    questions: [
      "Tell me about yourself.",
      "What are your greatest strengths?",
      "What are your weaknesses?",
      "Why do you want to work here?",
      "Where do you see yourself in 5 years?",
      "Describe a challenging situation and how you handled it.",
      "Tell me about a time you worked in a team.",
      "What motivates you?",
      "How do you handle stress?",
      "Why should we hire you?"
    ]
  },
  {
    id: "technical-hr",
    name: "Technical HR Interview",
    type: "Technical HR",
    difficulty: "Hard",
    duration: 45,
    questions: [
      "Explain a complex technical concept in simple terms.",
      "How do you stay updated with technology?",
      "Describe a technical project you're proud of.",
      "How do you approach problem-solving?",
      "Tell me about a time you had to learn something new quickly.",
      "How do you handle technical disagreements?",
      "Describe your experience with version control.",
      "What development methodologies do you prefer?",
      "How do you ensure code quality?",
      "Tell me about a time you debugged a difficult issue."
    ]
  },
  {
    id: "leadership",
    name: "Leadership Interview",
    type: "Leadership",
    difficulty: "Hard",
    duration: 45,
    questions: [
      "Tell me about a time you led a team.",
      "How do you motivate your team members?",
      "Describe a time you had to make a difficult decision.",
      "How do you handle conflict in your team?",
      "What is your leadership style?",
      "Tell me about a time you failed as a leader.",
      "How do you delegate tasks?",
      "Describe a time you had to influence without authority.",
      "How do you develop your team members?",
      "Tell me about a time you had to manage multiple priorities."
    ]
  },
  {
    id: "entry-level",
    name: "Entry Level Interview",
    type: "HR",
    difficulty: "Easy",
    duration: 20,
    questions: [
      "Why are you interested in this role?",
      "What do you know about our company?",
      "What are your career goals?",
      "Why did you choose this field?",
      "What skills do you bring to this role?",
      "How do you handle feedback?",
      "What are you looking for in a company?",
      "Tell me about your educational background.",
      "Do you have any questions for us?",
      "What are your salary expectations?"
    ]
  }
];

export interface CompletedInterview {
  id: string;
  category: string;
  date: string;
  score: number;
  duration: number;
}

