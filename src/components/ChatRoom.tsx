import React, { useState, useRef } from 'react';
import { useMatrixSync } from '../hooks/useMatrixSync';
import { matrixService } from '../services/matrixService';
import { Send, LogOut } from 'lucide-react';
import { truncateUsername, formatTimestamp } from '../utils/matrix.utils';
import bihuaLogo from '../assets/bihua.png';

interface ChatRoomProps {
  roomId: string;
}

export function ChatRoom({ roomId }: ChatRoomProps) {
  const { messages, isLoading, error: syncError } = useMatrixSync(roomId);
  const [newMessage, setNewMessage] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [textareaHeight, setTextareaHeight] = useState(100);
  const resizeRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);
  const lastYRef = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isResizingRef.current = true;
    lastYRef.current = e.clientY;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizingRef.current) return;
    const delta = lastYRef.current - e.clientY;
    setTextareaHeight((prev) => Math.min(Math.max(prev + delta, 100), 400));
    lastYRef.current = e.clientY;
  };

  const handleMouseUp = () => {
    isResizingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSendError(null);
    try {
      await matrixService.sendMessage(roomId, newMessage);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      setSendError('Failed to send message. Please try again.');
      console.error('Failed to send message:', error);
    }
  };

  const handleLogout = () => {
    matrixService.disconnect();
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#F5F5F5]">
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center">
          <img src={bihuaLogo} alt="笔画 Logo" className="w-6 h-6 mr-2" />
          <h1 className="text-xl font-semibold text-gray-800">笔画</h1>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center text-gray-600 hover:text-gray-800"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={`${message.id}-${message.timestamp}`}
            className={`flex ${
              message.sender === matrixService.getUserId()
                ? 'justify-end'
                : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                message.sender === matrixService.getUserId()
                  ? 'bg-green-400 text-gray-900'
                  : 'bg-white text-gray-900'
              }`}
            >
              <div className="text-sm font-medium">
                {truncateUsername(message.sender)}
              </div>
              <div className="break-words mt-1">{message.content}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {(syncError || sendError) && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-600">{syncError || sendError}</p>
        </div>
      )}

      <div
        ref={resizeRef}
        className="h-1 bg-gray-200 cursor-ns-resize hover:bg-gray-300 transition-colors"
        onMouseDown={handleMouseDown}
      />

      <form onSubmit={handleSend} className="bg-white">
        <div className="p-4 flex space-x-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            style={{ height: `${textareaHeight}px` }}
            className="flex-1 resize-none outline-none focus:outline-none p-2 bg-white"
            placeholder="输入消息..."
          />
          <button
            type="submit"
            className="self-end inline-flex items-center px-4 py-2 border border-gray-200 rounded-md shadow-sm text-sm font-medium bg-[#E9E9E9] hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Send className="w-4 h-4 text-green-600" />
          </button>
        </div>
      </form>
    </div>
  );
}