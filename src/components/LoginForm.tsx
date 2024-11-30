import React, { useState } from 'react';
import { matrixService } from '../services/matrixService';
import { MATRIX_CONFIG } from '../config/matrix.config';
import bihuaLogo from '../assets/bihua.png';

interface LoginFormProps {
  onLoginSuccess: () => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [homeserver] = useState(MATRIX_CONFIG.defaultHomeServer);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await matrixService.login(homeserver, username, password);
      onLoginSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Login failed. Please check your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-w-[320px] p-6">
      <div className="flex flex-col items-center justify-center mb-8">
        <img
          src={bihuaLogo}
          alt="笔画 Logo"
          className="w-16 h-16 mb-2"
        />
        <h2 className="text-2xl font-bold text-gray-800">笔画</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            服务器
          </label>
          <input
            type="url"
            value={homeserver}
            disabled={true}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50 text-gray-600"
          />
        </div>

        <div>
  <label className="block text-sm font-medium text-gray-700">
    用户名
  </label>
  <input
    type="text"
    value={username}
    onChange={(e) => setUsername(e.target.value)}
    placeholder="输入用户名"
    className="mt-1 block w-full rounded-md border-none shadow-sm focus:outline-none focus:ring-0"
    required
    disabled={isLoading}
  />
</div>

<div>
  <label className="block text-sm font-medium text-gray-700">
    密码
  </label>
  <input
    type="password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    placeholder="输入密码"
    className="mt-1 block w-full rounded-md border-none shadow-sm focus:outline-none focus:ring-0"
    required
    disabled={isLoading}
  />
</div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}