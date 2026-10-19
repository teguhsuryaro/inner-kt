'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login, quickLoginAs, getCurrentSession } from '@/lib/auth';
import { Shield, ArrowRight, Eye, EyeOff, Lock, Mail, CheckCircle2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If already logged in, redirect straight to dashboard
    const session = getCurrentSession();
    if (session && session.admin) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = login(email, password);
    if (res.success) {
      router.replace('/dashboard');
    } else {
      setError(res.error || 'Autentikasi gagal.');
      setLoading(false);
    }
  };

  const handleQuickLogin = (adminUser: 'admin1' | 'admin2' | 'admin3') => {
    setError(null);
    setLoading(true);
    try {
      quickLoginAs(adminUser);
      router.replace('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal quick login');
      setLoading(false);
    }
  };

  const handleFillCredentials = (emailVal: string, passVal: string) => {
    setEmail(emailVal);
    setPassword(passVal);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-8">
      {/* Background Subtle Grid Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40" />

      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        {/* Top Header Strip */}
        <div className="bg-slate-950 px-6 py-5 text-white border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider font-semibold bg-blue-600/20 text-blue-400 border border-blue-500/30">
                INTERNAL SYSTEM
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs text-slate-400 font-mono">v1.0 Ready</span>
            </div>
            <Shield className="w-4 h-4 text-slate-400" />
          </div>
          <h1 className="mt-3 text-lg font-bold tracking-tight text-white font-sans flex items-center gap-2">
            inner-kt <span className="text-slate-400 font-normal">/</span> Kanal Tiga
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Sistem Pencatatan Keuangan, Aset & CRM Pemilik
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Akun Admin
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin1@kanaltiga.internal"
                  required
                  className="w-full text-sm px-3 py-2 pl-9 bg-slate-50 border border-slate-300 rounded text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 font-mono"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full text-sm px-3 py-2 pl-9 pr-10 bg-slate-50 border border-slate-300 rounded text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 font-mono"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs tracking-wider uppercase rounded transition flex items-center justify-center gap-2 shadow-xs"
            >
              {loading ? (
                <span>Memproses Masuk...</span>
              ) : (
                <>
                  <span>Masuk ke Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Access Dev / Internal 3 Admins */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
                Akses Cepat Akun Pemilik (1-Klik Masuk)
              </span>
              <span className="text-[10px] text-slate-400">Dev & Internal Ops</span>
            </div>

            <div className="space-y-2">
              {/* Admin 1 - Surya */}
              <div className="flex items-center justify-between p-2 rounded border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-50 transition">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    <span className="text-xs font-semibold text-indigo-950 font-sans">
                      Admin 1 — Surya
                    </span>
                    <span className="text-[10px] font-mono text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded border border-indigo-200">
                      Pemilik 1
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-600 truncate mt-0.5">
                    admin1@kanaltiga.internal
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleFillCredentials('admin1@kanaltiga.internal', 'Admin1KanalTiga!')}
                    className="px-2 py-1 text-[11px] font-mono text-slate-600 bg-white hover:bg-slate-100 border border-slate-300 rounded"
                    title="Isi Form"
                  >
                    Isi
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin1')}
                    className="px-2.5 py-1 text-[11px] font-medium text-white bg-indigo-700 hover:bg-indigo-800 rounded flex items-center gap-1"
                  >
                    <span>Masuk</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Admin 2 - Pemilik B */}
              <div className="flex items-center justify-between p-2 rounded border border-teal-200 bg-teal-50/70 hover:bg-teal-50 transition">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                    <span className="text-xs font-semibold text-teal-950 font-sans">
                      Admin 2 — Pemilik B
                    </span>
                    <span className="text-[10px] font-mono text-teal-700 bg-teal-100 px-1.5 py-0.2 rounded border border-teal-200">
                      Pemilik 2
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-600 truncate mt-0.5">
                    admin2@kanaltiga.internal
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleFillCredentials('admin2@kanaltiga.internal', 'Admin2KanalTiga!')}
                    className="px-2 py-1 text-[11px] font-mono text-slate-600 bg-white hover:bg-slate-100 border border-slate-300 rounded"
                    title="Isi Form"
                  >
                    Isi
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin2')}
                    className="px-2.5 py-1 text-[11px] font-medium text-white bg-teal-700 hover:bg-teal-800 rounded flex items-center gap-1"
                  >
                    <span>Masuk</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Admin 3 - Pemilik C */}
              <div className="flex items-center justify-between p-2 rounded border border-amber-200 bg-amber-50/70 hover:bg-amber-50 transition">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                    <span className="text-xs font-semibold text-amber-950 font-sans">
                      Admin 3 — Pemilik C
                    </span>
                    <span className="text-[10px] font-mono text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-200">
                      Pemilik 3
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-600 truncate mt-0.5">
                    admin3@kanaltiga.internal
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleFillCredentials('admin3@kanaltiga.internal', 'Admin3KanalTiga!')}
                    className="px-2 py-1 text-[11px] font-mono text-slate-600 bg-white hover:bg-slate-100 border border-slate-300 rounded"
                    title="Isi Form"
                  >
                    Isi
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin3')}
                    className="px-2.5 py-1 text-[11px] font-medium text-white bg-amber-700 hover:bg-amber-800 rounded flex items-center gap-1"
                  >
                    <span>Masuk</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Password Bawaan: <code className="font-mono text-slate-600 bg-slate-100 px-1 rounded">Admin[1|2|3]KanalTiga!</code></span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 text-center">
          <p className="text-[11px] text-slate-500">
            Aplikasi Khusus Internal Pemilik &bull; Kanal Tiga Audio &amp; Event Equipment
          </p>
        </div>
      </div>
    </div>
  );
}
