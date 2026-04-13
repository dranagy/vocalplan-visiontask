
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
  date: string; // ISO string YYYY-MM-DD
}

export interface VoiceNote {
  id: string;
  audioData: string; // Base64 string
  timestamp: string; // Local time string
  date: string; // YYYY-MM-DD
  duration: string;
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
