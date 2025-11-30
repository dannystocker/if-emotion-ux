
export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: Date;
  isError?: boolean;
  reactions?: string[];
}

export interface Session {
  id: string;
  folderId?: string; // Optional folder association
  title: string;
  messages: Message[];
  updatedAt: Date;
}

export interface Folder {
  id: string;
  name: string;
}

export enum Language {
  EN = 'en',
  ES = 'es',
  FR = 'fr',
}

export enum AppMode {
  SIMPLE = 'simple',
  ADVANCED = 'advanced',
}

export interface UIString {
  en: string;
  es: string;
  fr: string;
}

export type LocalizedStrings = {
  [key: string]: UIString;
};

export type ExportFormat = 'json' | 'md' | 'txt' | 'pdf';