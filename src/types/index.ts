export type SubjectColor = 'emerald' | 'indigo' | 'amber' | 'rose' | 'sky' | 'purple' | 'teal';

export interface Subject {
  id: string;
  name: string;
  code: string;
  color: SubjectColor;
  icon: string; // Lucide icon name
  description: string;
  totalMinutesStudied: number;
  targetHours: number;
}

export interface DocumentPage {
  pageNumber: number;
  title: string;
  content: string;
  subsections?: Array<{
    title: string;
    body: string;
    equation?: string;
  }>;
  keyTerms?: Array<{ term: string; definition: string }>;
}

export interface StudyDocument {
  id: string;
  subjectId: string;
  title: string;
  author: string;
  totalPages: number;
  pages: DocumentPage[];
  fileType: 'bundled' | 'uploaded';
  fileDataUrl?: string;
  uploadedAt: string;
  bookmarks: number[];
}

export type HighlightColor = 'yellow' | 'green' | 'pink' | 'blue' | 'purple';

export interface Highlight {
  id: string;
  docId: string;
  page: number;
  text: string;
  color: HighlightColor;
  note?: string;
  createdAt: string;
  tags?: string[];
  authorId?: string;
  authorName?: string;
  authorColor?: string;
}

export interface Annotation {
  id: string;
  docId: string;
  page: number;
  x: number; // percentage of page width (0-100)
  y: number; // percentage of page height (0-100)
  content: string;
  color: string;
  createdAt: string;
  authorId?: string;
  authorName?: string;
  authorColor?: string;
}

export type TaskPriority = 'low' | 'medium' | 'high';

export interface StudyTask {
  id: string;
  subjectId: string;
  title: string;
  dueDate?: string;
  priority: TaskPriority;
  completed: boolean;
  estimatedPomodoros: number;
  completedPomodoros: number;
  createdAt: string;
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'fill_blank' | 'short_answer';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  hint?: string;
  userAnswer?: string;
  isCorrect?: boolean;
  contributedBy?: string;
}

export interface SavedQuiz {
  id: string;
  subjectId: string;
  docId?: string;
  title: string;
  topic: string;
  pageReference: string;
  summary?: string;
  questions: QuizQuestion[];
  score?: number;
  totalQuestions: number;
  completedAt?: string;
  createdAt: string;
  isCollaborative?: boolean;
  groupId?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  contextSnippet?: string;
  pageRef?: number;
  isStreaming?: boolean;
}

export type TutorMode = 'socratic' | 'feynman' | 'exam' | 'summarizer';

export type PomodoroPreset = 'classic' | 'deep' | 'sprint' | 'custom';

export interface PomodoroSettings {
  preset: PomodoroPreset;
  workDuration: number;
  shortBreak: number;
  longBreak: number;
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  soundEnabled: boolean;
  ambientSound: 'none' | 'lofi' | 'rain' | 'whitenoise' | 'library';
  ambientVolume: number;
}

// -------------------------------------------------------------
// Real-time Collaborative Study Groups Types
// -------------------------------------------------------------

export interface StudyPeer {
  id: string;
  name: string;
  color: string;
  isHost: boolean;
  currentDocId?: string;
  currentPage?: number;
  joinedAt: string;
}

export interface GroupChatMessage {
  id: string;
  peerId: string;
  peerName: string;
  peerColor: string;
  content: string;
  timestamp: string;
  type: 'chat' | 'system' | 'view_share' | 'quiz_invite';
  sharedView?: {
    docId: string;
    docTitle: string;
    page: number;
    snippet?: string;
  };
  quizData?: {
    quizId: string;
    title: string;
    questionCount: number;
  };
}

export interface SharedView {
  docId: string;
  docTitle: string;
  page: number;
  sharedBy: string;
  snippet?: string;
  timestamp: string;
}

export interface CollaborativeQuiz {
  id: string;
  roomId: string;
  title: string;
  topic: string;
  pageReference: string;
  createdBy: string;
  questions: QuizQuestion[];
  status: 'drafting' | 'active' | 'completed';
  scores: Record<string, { peerName: string; score: number; completedAt: string }>;
  createdAt: string;
}

export interface StudyRoomState {
  id: string;
  name: string;
  subjectId: string;
  hostId: string;
  peers: StudyPeer[];
  messages: GroupChatMessage[];
  sharedView: SharedView | null;
  annotations: Annotation[];
  highlights: Highlight[];
  quizzes: CollaborativeQuiz[];
}
