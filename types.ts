export enum AppMode {
  DASHBOARD = 'DASHBOARD',
  VOCABULARY = 'VOCABULARY',
  SCENARIO = 'SCENARIO',
  LIVE_CONVERSATION = 'LIVE_CONVERSATION',
}

export interface DailyStats {
  vocabularyCount: number;
  minutesSpoken: number;
  streakDays: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface VocabularyItem {
  term: string;
  definition: string;
  example: string;
}

// Audio Types for Live API
export interface PCMFloat32Chunk {
  data: Float32Array;
}
