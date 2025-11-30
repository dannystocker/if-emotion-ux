import { OpenWebUIConfig, Session, Message, Role, OpenWebUIMessage } from '../types';
import { generateId } from '../utils';

/**
 * Claude Max API Client
 * OpenAI-compatible API for Claude Max subscription via CLI bridge
 */
export class OpenWebUIClient {
  private config: OpenWebUIConfig;
  private storageKey = 'if.emotion.sessions';

  constructor(config: OpenWebUIConfig) {
    this.config = config;
  }

  private get headers() {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  // Check connection via health endpoint
  async testConnection(): Promise<boolean> {
    try {
      const res = await fetch(`${this.config.baseUrl}/health`, { headers: this.headers });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  // Get available models from /v1/models
  async getModels(): Promise<string[]> {
    try {
      const res = await fetch(`${this.config.baseUrl}/v1/models`, { headers: this.headers });
      if (!res.ok) return [];
      const data = await res.json();
      return data.data?.map((m: any) => m.id) || [];
    } catch (e) {
      return [];
    }
  }

  // ========== LOCAL STORAGE SESSION MANAGEMENT ==========
  // Sessions are stored locally since the Claude Max API is stateless

  private getSessions(): Session[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveSessions(sessions: Session[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(sessions));
  }

  private getSessionMessages(sessionId: string): Message[] {
    try {
      const stored = localStorage.getItem(`${this.storageKey}.${sessionId}`);
      if (!stored) return [];
      const messages = JSON.parse(stored);
      // Restore Date objects
      return messages.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp)
      }));
    } catch {
      return [];
    }
  }

  private saveSessionMessages(sessionId: string, messages: Message[]): void {
    localStorage.setItem(`${this.storageKey}.${sessionId}`, JSON.stringify(messages));
  }

  // Create a new chat session (local)
  async createChat(title: string): Promise<Session> {
    const session: Session = {
      id: generateId(),
      title,
      updated_at: Math.floor(Date.now() / 1000)
    };

    const sessions = this.getSessions();
    sessions.unshift(session);
    this.saveSessions(sessions);

    return session;
  }

  // Get all chats (local)
  async getChats(): Promise<Session[]> {
    return this.getSessions().sort((a, b) => b.updated_at - a.updated_at);
  }

  // Get chat history (local)
  async getChatHistory(chatId: string): Promise<Message[]> {
    return this.getSessionMessages(chatId);
  }

  // Delete chat (local)
  async deleteChat(chatId: string): Promise<void> {
    const sessions = this.getSessions().filter(s => s.id !== chatId);
    this.saveSessions(sessions);
    localStorage.removeItem(`${this.storageKey}.${chatId}`);
  }

  // Delete specific message (local)
  async deleteMessage(chatId: string, messageId: string): Promise<void> {
    const messages = this.getSessionMessages(chatId);
    const filtered = messages.filter(m => m.id !== messageId);
    this.saveSessionMessages(chatId, filtered);
  }

  // Add message to chat (local persistence)
  async addMessageToChat(chatId: string, message: Message): Promise<void> {
    const messages = this.getSessionMessages(chatId);
    messages.push(message);
    this.saveSessionMessages(chatId, messages);

    // Update session timestamp
    const sessions = this.getSessions();
    const session = sessions.find(s => s.id === chatId);
    if (session) {
      session.updated_at = Math.floor(Date.now() / 1000);
      this.saveSessions(sessions);
    }
  }

  // Send message to Claude Max API
  async sendMessage(
    chatId: string | null,
    content: string,
    history: Message[],
    model: string,
    offTheRecord: boolean = false
  ): Promise<ReadableStreamDefaultReader<Uint8Array>> {

    // Convert history to OpenAI format
    const contextMessages: OpenWebUIMessage[] = history.map(m => ({
      role: m.role,
      content: m.content
    }));

    // Add current user message
    contextMessages.push({ role: Role.USER, content });

    const payload = {
      model: model,
      messages: contextMessages,
      stream: true,
    };

    const res = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }

    if (!res.body) throw new Error('No response body');
    return res.body.getReader();
  }
}
