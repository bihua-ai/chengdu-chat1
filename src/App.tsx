import React, { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm';
import { ChatRoom } from './components/ChatRoom';
import { matrixService } from './services/matrixService';
import { MATRIX_CONFIG } from './services/matrixConfig';

export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoggedIn) {
      // The room is pre-selected, no need to load room list
      setError(null);
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoginForm onLoginSuccess={() => setIsLoggedIn(true)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1">
        <ChatRoom roomId={MATRIX_CONFIG.defaultRoomId} />
      </div>
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
}

export default App;