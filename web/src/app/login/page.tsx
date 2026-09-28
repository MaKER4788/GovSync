'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getUserByEmail } from '@/lib/auth/users.ts';
import { loginAction } from '@/lib/auth/action.ts';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await loginAction(formData);
    if (result?.error) {
      setError(result.error);
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold">GovSync</h1>
        <p className="text-sm text-muted-foreground">
          Connected Government Services
        </p>
        <span className="text-xs bg-muted/20 rounded px-2 py-0.5">SIMULATION MODE</span>

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:focus-visible:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center rounded-border bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
                  <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Signing in...
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="text-center">
          <h2 className="text-sm font-semibold">DEMO ACCOUNTS</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            <button
              onClick={() => {
                setEmail('citizen@govsync.demo');
              }}
              className="flex-1 xs:auto rounded-border border px-3 py-2 text-sm hover:bg-accent"
            >
              Continue as Citizen
            </button>
            <button
              onClick={() => {
                setEmail('revenue.officer@govsync.demo');
              }}
              className="flex-1 xs:auto rounded-border border px-3 py-2 text-sm hover:bg-accent"
            >
              Continue as Revenue Officer
            </button>
            <button
              onClick={() => {
                setEmail('pollution.officer@govsync.demo');
              }}
              className="flex-1 xs:auto rounded-border border px-3 py-2 text-sm hover:bg-accent"
            >
              Continue as Pollution Officer
            </button>
            <button
              onClick={() => {
                setEmail('fire.officer@govsync.demo');
              }}
              className="flex-1 xs:auto rounded-border border px-3 py-2 text-sm hover:bg-accent"
            >
              Continue as Fire Officer
            </button>
            <button
              onClick={() => {
                setEmail('labour.officer@govsync.demo');
              }}
              className="flex-1 xs:auto rounded-border border px-3 py-2 text-sm hover:bg-accent"
            >
              Continue as Labour Officer
            </button>
            <button
              onClick={() => {
                setEmail('admin@govsync.demo');
              }}
              className="flex-1 xs:auto rounded-border border px-3 py-2 text-sm hover:bg-accent"
            >
              Continue as GovSync Admin
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}