export type UserRole = 'organizer' | 'student';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface SessionParams {
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // в минутах
  language: 'ru' | 'en';
  goals: string[];
  personality: 'friendly' | 'professional' | 'motivating';
  
  // Расширенный контекст для AI
  roleContext?: string; // Роль AI (например, "преподаватель JavaScript", "технический интервьюер")
  contextDescription?: string; // Детальное описание контекста и ситуации
  evaluationCriteria?: string[]; // Критерии оценки ученика
  expectedKnowledge?: string; // Предполагаемый уровень знаний ученика
  interactionStyle?: 'questions' | 'practice' | 'theory' | 'mixed'; // Стиль взаимодействия
  focusAreas?: string[]; // Ключевые области фокуса
  additionalInstructions?: string; // Дополнительные инструкции для AI
}

export interface Session {
  id: string;
  organizerId: string;
  organizerName: string;
  params: SessionParams;
  createdAt: string;
  shareUrl: string;
}

export interface SessionResult {
  id: string;
  sessionId: string;
  studentId?: string; // undefined если не зарегистрирован
  studentName?: string;
  startedAt: string;
  completedAt?: string;
  transcript: Array<{
    role: 'ai' | 'user';
    message: string;
    timestamp: string;
  }>;
  summary?: string;
  score?: number;
}