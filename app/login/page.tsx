'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthState, validateCredentials, setAuthState } from '@/lib/auth';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (getAuthState()) {
      router.replace('/');
    }
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validateCredentials(username, password)) {
      setAuthState(username);
      router.push('/');
    } else {
      setError('Invalid username or password.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm bg-card-bg border border-card-border rounded-xl shadow-lg p-8">
        {/* Logo / branding */}
        <div className="text-center mb-8">
          <div className="text-3xl font-black text-accent mb-1">LZR</div>
          <p className="text-sm text-foreground/50">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-foreground/70 mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              className="w-full px-3 py-2 rounded-lg bg-background border border-card-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
              placeholder="Enter username"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground/70 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              className="w-full px-3 py-2 rounded-lg bg-background border border-card-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
              placeholder="Enter password"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent/90 text-white font-semibold text-sm transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
