import * as sdk from 'matrix-js-sdk';
import { MATRIX_CONFIG } from '../config/matrix.config';
import type { Message, Room, MatrixCredentials } from '../types/matrix';

export class MatrixClient {
  private client: sdk.MatrixClient;
  private initialized: boolean = false;

  constructor(credentials: MatrixCredentials) {
    this.client = sdk.createClient({
      baseUrl: credentials.homeServer,
      accessToken: credentials.accessToken,
      userId: credentials.userId,
      deviceId: credentials.deviceId,
      timelineSupport: true,
    });
  }

  async start(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.client.startClient({ initialSyncLimit: MATRIX_CONFIG.initialSyncLimit });
      
      // Wait for the client to be ready
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Client initialization timeout'));
        }, 30000);

        const handler = (state: string) => {
          if (state === 'PREPARED') {
            clearTimeout(timeout);
            this.client.removeListener('sync', handler);
            resolve();
          }
        };
        
        this.client.on('sync', handler);
      });

      this.initialized = true;
    } catch (error) {
      console.error('Failed to start Matrix client:', error);
      this.stop();
      throw error;
    }
  }

  async sendMessage(roomId: string, content: string): Promise<void> {
    if (!this.initialized) {
      throw new Error(MATRIX_CONFIG.errors.NOT_INITIALIZED);
    }

    if (content.length > MATRIX_CONFIG.maxMessageLength) {
      throw new Error(`Message exceeds maximum length of ${MATRIX_CONFIG.maxMessageLength} characters`);
    }

    try {
      await this.client.sendEvent(roomId, MATRIX_CONFIG.messageType, {
        msgtype: 'm.text',
        body: content,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error(MATRIX_CONFIG.errors.MESSAGE_SEND_FAILED);
    }
  }

  async getHistoricalMessages(roomId: string, limit = 50): Promise<Message[]> {
    if (!this.initialized) {
      throw new Error(MATRIX_CONFIG.errors.NOT_INITIALIZED);
    }

    try {
      const room = this.client.getRoom(roomId);
      if (!room) {
        throw new Error(MATRIX_CONFIG.errors.INVALID_ROOM_ID);
      }

      // Get the timeline from the room state
      const timelineEvents = room.timeline
        .filter(event => event.getType() === MATRIX_CONFIG.messageType)
        .slice(-limit)
        .map(event => ({
          id: event.getId() || Date.now().toString(),
          content: event.getContent().body,
          sender: event.getSender() || 'Unknown',
          timestamp: event.getTs(),
          roomId: event.getRoomId() || '',
        }));

      // If we don't have enough messages in the timeline, fetch more from the server
      if (timelineEvents.length < limit) {
        const response = await this.client.createMessagesRequest(
          roomId,
          room.oldState.paginationToken,
          limit - timelineEvents.length,
          'b'
        );

        const additionalEvents = response.chunk
          .filter(event => event.type === MATRIX_CONFIG.messageType)
          .map(event => ({
            id: event.event_id || Date.now().toString(),
            content: event.content.body,
            sender: event.sender || 'Unknown',
            timestamp: event.origin_server_ts,
            roomId: event.room_id || '',
          }));

        return [...additionalEvents, ...timelineEvents];
      }

      return timelineEvents;
    } catch (error) {
      console.error('Error fetching historical messages:', error);
      throw new Error('Failed to load message history');
    }
  }

  subscribeToMessages(callback: (message: Message) => void): void {
    if (!this.initialized) {
      throw new Error(MATRIX_CONFIG.errors.NOT_INITIALIZED);
    }

    this.client.on('Room.timeline', (event) => {
      if (event.getType() !== MATRIX_CONFIG.messageType) return;
      
      const message: Message = {
        id: event.getId() || Date.now().toString(),
        content: event.getContent().body,
        sender: event.getSender() || 'Unknown',
        timestamp: event.getTs(),
        roomId: event.getRoomId() || '',
      };
      callback(message);
    });
  }

  getUserId(): string | null {
    return this.client.getUserId();
  }

  stop(): void {
    if (this.initialized) {
      this.client.stopClient();
      this.initialized = false;
    }
  }

  getRooms(): Room[] {
    if (!this.initialized) {
      throw new Error(MATRIX_CONFIG.errors.NOT_INITIALIZED);
    }

    return this.client.getRooms().map(room => ({
      id: room.roomId,
      name: room.name || room.roomId,
    }));
  }
}