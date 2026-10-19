'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth';

/**
 * Root Redirector
 * STRICT RULE 1: ZERO LANDING PAGE.
 * Opens / -> checks auth -> redirects instantly to /dashboard if logged in, or /login if not.
 */
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const session = getCurrentSession();
    if (session && session.admin) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-slate-400">inner-kt • Memeriksa Sesi Internal...</p>
      </div>
    </div>
  );
}
