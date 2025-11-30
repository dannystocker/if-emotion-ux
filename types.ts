
export enum Role {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export interface Message {
  id: string; // Internal UUID
  role: Role;
  content: string;
  timestamp: Date;
  // For UI state
  pending?: boolean;
  error?: boolean;
  reactions?: string[];
}

export interface OpenWebUIMessage {
  role: string;
  content: string;
}

export interface Session {
  id: string;
  title: string;
  updated_at: number; // Unix timestamp
  folder_id?: string;
}

export interface Folder {
  id: string;
  name: string;
}

export interface OpenWebUIConfig {
  baseUrl: string;
  apiKey: string;
}

export interface UserSettings {
  baseUrl: string;
  apiKey: string;
  advancedMode: boolean;  // Enable Sergio's personality DNA (RAG)
}

export enum Language {
  EN = 'en',
  ES = 'es',
}

export enum AppMode {
  SIMPLE = 'simple',
  ADVANCED = 'advanced'
}

export type ExportFormat = 'json' | 'txt' | 'md' | 'pdf';
