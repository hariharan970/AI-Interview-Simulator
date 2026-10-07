export interface DiscussionTopic {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  participants: number;
}

export const discussionTopics: DiscussionTopic[] = [
  {
    id: "remote-work",
    title: "Remote Work: Pros and Cons",
    description: "Discuss the advantages and disadvantages of remote work in the modern workplace.",
    durationMinutes: 15,
    participants: 6
  },
  {
    id: "ai-impact",
    title: "Impact of AI on Employment",
    description: "Debate how artificial intelligence will affect job markets and employment opportunities.",
    durationMinutes: 15,
    participants: 6
  },
  {
    id: "sustainability",
    title: "Corporate Sustainability",
    description: "Discuss the role of corporations in environmental sustainability and social responsibility.",
    durationMinutes: 15,
    participants: 6
  },
  {
    id: "education-reform",
    title: "Education System Reform",
    description: "Debate necessary reforms in the education system to prepare students for the future.",
    durationMinutes: 15,
    participants: 6
  },
  {
    id: "work-life-balance",
    title: "Work-Life Balance",
    description: "Discuss strategies for maintaining a healthy work-life balance in today's fast-paced world.",
    durationMinutes: 15,
    participants: 6
  },
  {
    id: "diversity-inclusion",
    title: "Diversity and Inclusion",
    description: "Explore the importance of diversity and inclusion in modern organizations.",
    durationMinutes: 15,
    participants: 6
  }
];

export interface FeedbackMetrics {
  speakingTime: number;
  engagement: number;
  keyPoints: string[];
  suggestions: string[];
}

