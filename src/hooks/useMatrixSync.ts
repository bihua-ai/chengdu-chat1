import { useState, useEffect } from 'react';
import { matrixService } from '../services/matrixService';
import type { Message } from '../types/matrix';

export function useMatrixSync(roomId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadHistoricalMessages = async () => {
      try {
        const historicalMessages = await matrixService.getHistoricalMessages(roomId);
        if (mounted) {
          setMessages(historicalMessages.reverse());
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load message history');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    const handleNewMessage = (message: Message) => {
      if (message.roomId === roomId) {
        setMessages(prev => [...prev, message]);
      }
    };

    loadHistoricalMessages();
    
    try {
      matrixService.subscribeToMessages(handleNewMessage);
    } catch (err) {
      if (mounted) {
        setError(err instanceof Error ? err.message : 'Failed to sync messages');
      }
    }

    return () => {
      mounted = false;
      matrixService.unsubscribeFromMessages(handleNewMessage);
    };
  }, [roomId]);

  return { messages, isLoading, error };
}