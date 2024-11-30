import { MatrixAuth } from './matrixAuth';
import { MatrixClient } from './matrixClient';
import type { Message, Room } from '../types/matrix';

class MatrixService {
  private client: MatrixClient | null = null;
  private messageCallbacks: Set<(message: Message) => void> = new Set();

  async login(homeserverUrl: string, username: string, password: string) {
    try {
      const credentials = await MatrixAuth.login(homeserverUrl, username, password);
      this.client = new MatrixClient(credentials);
      await this.client.start();
      return credentials;
    } catch (error) {
      console.error('Login failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(errorMessage);
    }
  }

  getUserId(): string | null {
    return this.client?.getUserId() || null;
  }

  async sendMessage(roomId: string, content: string): Promise<void> {
    if (!this.client) throw new Error('Not logged in');
    return this.client.sendMessage(roomId, content);
  }

  async getHistoricalMessages(roomId: string, limit?: number): Promise<Message[]> {
    if (!this.client) throw new Error('Not logged in');
    return this.client.getHistoricalMessages(roomId, limit);
  }

  async getRooms(): Promise<Room[]> {
    if (!this.client) throw new Error('Not logged in');
    return this.client.getRooms();
  }

  subscribeToMessages(callback: (message: Message) => void): void {
    if (!this.client) throw new Error('Not logged in');
    this.messageCallbacks.add(callback);
    this.client.subscribeToMessages((message) => {
      this.messageCallbacks.forEach(cb => cb(message));
    });
  }

  unsubscribeFromMessages(callback: (message: Message) => void): void {
    this.messageCallbacks.delete(callback);
  }

  disconnect(): void {
    if (this.client) {
      this.client.stop();
      this.client = null;
      this.messageCallbacks.clear();
    }
  }
}

export const matrixService = new MatrixService();