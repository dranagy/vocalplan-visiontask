export enum TaskCategory {
  URGENT_IMPORTANT = 'URGENT_IMPORTANT',
  IMPORTANT_NOT_URGENT = 'IMPORTANT_NOT_URGENT',
  URGENT_NOT_IMPORTANT = 'URGENT_NOT_IMPORTANT',
  NOT_URGENT_NOT_IMPORTANT = 'NOT_URGENT_NOT_IMPORTANT'
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE'
}

export enum TaskSource {
  VOICE = 'VOICE',
  IMAGE = 'IMAGE',
  MANUAL = 'MANUAL',
  DOCUMENT = 'DOCUMENT'
}

export enum TeamRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export type ViewMode = 'eisenhower' | 'kanban';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  status: TaskStatus;
  source: TaskSource;
  date: string;
  deadline?: string | null;
  completed?: boolean;
  order?: number;
  assigneeId?: string | null;
  userId?: string;
  teamId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface VoiceNote {
  id: string;
  audioData?: string;
  audioUrl?: string;
  transcript?: string | null;
  timestamp?: string;
  date: string;
  duration: string;
  userId?: string;
  createdAt?: string;
}

export interface ImageNote {
  id: string;
  imageUrl: string;
  extractedText?: string | null;
  date: string;
  userId?: string;
  teamId?: string | null;
  createdAt?: string;
}

export interface DayData {
  date: string;
  tasks: Task[];
  voiceNotes: VoiceNote[];
  imageNotes: ImageNote[];
}

export interface EisenhowerMatrixData {
  urgentImportant: string[];
  importantNotUrgent: string[];
  urgentNotImportant: string[];
  notUrgentNotImportant: string[];
}

export interface GeminiTaskResponse {
  tasks: {
    title: string;
    description: string;
    deadline: string;
    resourceName: string;
  }[];
}

export interface Team {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: string;
  members?: TeamMember[];
  _count?: { tasks: number; members: number };
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  joinedAt: string;
  user?: { id: string; name: string | null; email: string };
}
