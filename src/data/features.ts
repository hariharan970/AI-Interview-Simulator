import { Brain, Code, Users, FileText, Compass, MessageSquare, DollarSign, BarChart3, Map, TrendingUp } from "lucide-react";

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  details: {
    overview: string;
    benefits: string[];
    howItWorks: string[];
  };
}

export const features: Feature[] = [
  {
    id: "interview-insights",
    title: "AI Interview Insights",
    description: "Data-driven interview performance analysis and benchmarks.",
    icon: BarChart3,
    color: "accent",
    details: {
      overview: "Access comprehensive analytics comparing your interview performance against industry benchmarks.",
      benefits: [
        "Performance tracking over time",
        "Industry benchmark comparisons",
        "Strengths and weaknesses identification",
        "Progress visualization"
      ],
      howItWorks: [
        "Complete various interview simulations",
        "AI analyzes your performance data",
        "View detailed charts and metrics",
        "Identify areas for improvement"
      ]
    }
  },
  {
    id: "aptitude-test",
    title: "AI Aptitude Test",
    description: "Test your IQ with AI-generated questions tailored to your career path.",
    icon: Brain,
    color: "primary",
    details: {
      overview: "Challenge yourself with dynamically generated aptitude questions designed to assess your cognitive abilities and problem-solving skills.",
      benefits: [
        "Personalized question difficulty based on performance",
        "Comprehensive scoring with detailed analytics",
        "Unlimited retakes to track improvement",
        "Time-based assessment for real interview simulation"
      ],
      howItWorks: [
        "Select your target role and difficulty level",
        "Complete timed multiple-choice questions",
        "Receive instant scoring and feedback",
        "Review detailed explanations for each question"
      ]
    }
  },
  {
    id: "coding-test",
    title: "AI Coding Test",
    description: "Live coding challenges with real-time AI feedback and analysis.",
    icon: Code,
    color: "secondary",
    details: {
      overview: "Practice coding interviews with AI-powered challenges that simulate real technical interviews from top tech companies.",
      benefits: [
        "Real-time code execution and testing",
        "AI-driven complexity analysis",
        "Multiple programming language support",
        "Detailed performance metrics"
      ],
      howItWorks: [
        "Choose a coding challenge or category",
        "Write your solution in the integrated editor",
        "Run tests and get instant feedback",
        "Review optimal solutions and time complexity"
      ]
    }
  },
  {
    id: "group-discussion",
    title: "Group Discussion",
    description: "AI evaluates speech, confidence, and collaboration skills.",
    icon: Users,
    color: "accent",
    details: {
      overview: "Participate in simulated group discussions with AI-powered evaluation of your communication and teamwork abilities.",
      benefits: [
        "Real-time speech analysis",
        "Confidence scoring",
        "Collaboration skills assessment",
        "Video and audio recording"
      ],
      howItWorks: [
        "Select a discussion topic",
        "Join virtual discussion rounds",
        "Record your contributions",
        "Receive AI-powered feedback on clarity and impact"
      ]
    }
  },
  {
    id: "resume-builder",
    title: "Resume Builder",
    description: "Create an AI-optimized resume with industry keywords.",
    icon: FileText,
    color: "secondary",
    details: {
      overview: "Build a professional resume enhanced with AI-suggested keywords and formatting optimized for ATS systems.",
      benefits: [
        "ATS-friendly templates",
        "AI keyword optimization",
        "Industry-specific suggestions",
        "Downloadable PDF format"
      ],
      howItWorks: [
        "Fill in your information",
        "AI suggests relevant keywords and phrases",
        "Preview and customize your resume",
        "Download professional PDF"
      ]
    }
  },
  {
    id: "career-guide",
    title: "AI Career Guide",
    description: "AI-driven career recommendations based on your skills.",
    icon: Compass,
    color: "accent",
    details: {
      overview: "Receive personalized career path recommendations powered by AI analysis of your skills, interests, and market trends.",
      benefits: [
        "Personalized career roadmaps",
        "Skill gap analysis",
        "Learning path recommendations",
        "Market trend insights"
      ],
      howItWorks: [
        "Complete a skills assessment",
        "Answer career preference questions",
        "Receive AI-generated role suggestions",
        "Get a detailed learning roadmap"
      ]
    }
  },
  {
    id: "mock-hr-interview",
    title: "Mock HR Interview",
    description: "Practice HR interviews with detailed AI feedback.",
    icon: MessageSquare,
    color: "primary",
    details: {
      overview: "Engage in realistic HR interview simulations with AI-powered feedback on your responses and interview technique.",
      benefits: [
        "Common HR question practice",
        "Response quality assessment",
        "Sample answer comparisons",
        "Behavioral interview prep"
      ],
      howItWorks: [
        "Choose interview type and seniority level",
        "Answer questions via text or voice",
        "Receive instant AI feedback",
        "Compare with sample expert answers"
      ]
    }
  },
  {
    id: "salary-negotiation",
    title: "Salary Negotiation Guide",
    description: "Master salary negotiation with AI coaching and real-world strategies.",
    icon: TrendingUp,
    color: "secondary",
    details: {
      overview: "Learn effective salary negotiation techniques with AI-powered coaching and personalized strategies based on market data.",
      benefits: [
        "Negotiation script templates",
        "Market salary comparisons",
        "Practice negotiations with AI",
        "Confidence building techniques"
      ],
      howItWorks: [
        "Learn negotiation fundamentals",
        "Practice with AI role-play scenarios",
        "Get personalized feedback",
        "Review successful negotiation cases"
      ]
    }
  },
  {
    id: "salary-estimator",
    title: "Salary Estimator",
    description: "AI predicts your earning potential based on market trends.",
    icon: DollarSign,
    color: "primary",
    details: {
      overview: "Get accurate salary estimates based on your role, experience, location, and current market conditions.",
      benefits: [
        "Real-time market data",
        "Location-based adjustments",
        "Experience level calculations",
        "Salary negotiation tips"
      ],
      howItWorks: [
        "Enter your role and experience",
        "Specify your location",
        "Receive salary range estimates",
        "View market trends and insights"
      ]
    }
  },
  {
    id: "career-roadmap",
    title: "Career Roadmap",
    description: "Personalized career path suggestions for long-term growth.",
    icon: Map,
    color: "accent",
    details: {
      overview: "Get a comprehensive, multi-phase career roadmap tailored to your goals and current position.",
      benefits: [
        "Phase-by-phase career planning",
        "Skill acquisition timeline",
        "Milestone tracking",
        "Exportable PDF roadmap"
      ],
      howItWorks: [
        "Define your career goals",
        "AI generates a personalized roadmap",
        "Track your progress through phases",
        "Export and share your roadmap"
      ]
    }
  }
];
