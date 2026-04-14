export enum TaskCategory {
  URGENT_IMPORTANT = 'URGENT_IMPORTANT',
  IMPORTANT_NOT_URGENT = 'IMPORTANT_NOT_URGENT',
  URGENT_NOT_IMPORTANT = 'URGENT_NOT_IMPORTANT',
  NOT_URGENT_NOT_IMPORTANT = 'NOT_URGENT_NOT_IMPORTANT'
}

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  date: string;
  deadline?: string | null;
  completed?: boolean;
  order?: number;
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

export interface DayData {
  date: string;
  tasks: Task[];
  voiceNotes: VoiceNote[];
}

export interface EisenhowerMatrixData {
  urgentImportant: string[];
  importantNotUrgent: string[];
  urgentNotImportant: string[];
  notUrgentNotImportant: string[];
}

export enum TeamRole {
  OWNER = 'OWNER',
  MEMBER = 'MEMBER',
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
