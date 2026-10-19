'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  getCurrentSession,
  logout,
  quickLoginAs,
  AuthSession,
} from '@/lib/auth';
import { innerKtStore, subscribeToStore, getStoreSnapshot } from '@/lib/store';
import { formatRupiah, getOwnerTheme } from '@/lib/formatters';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Receipt,
  Users2,
  UserCheck,
  History,
  LogOut,
  RotateCcw,
  Plus,
  Shield,
  Layers,
  ChevronRight,
  Sparkles,
  BarChart3,
  TrendingUp,
} from 'lucide-react';

export default function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Subscribe to store updates for topbar summary
  const storeVersion = useSyncExternalStore(
    subscribeToStore,
    getStoreSnapshot,
    () => 1
  );

  useEffect(() => {
    setIsClient(true);
    const curr = getCurrentSession();
    if (!curr || !curr.admin) {
      router.replace('/login');
    } else {
      setSession(curr);
    }
  }, [router, storeVersion]);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const handleQuickSwitch = (targetAdmin: 'admin1' | 'admin2' | 'admin3') => {
    const newSession = quickLoginAs(targetAdmin);
    setSession(newSession);
    // Reload current route or push
    router.refresh();
  };

  const handleResetSeed = () => {
    innerKtStore.resetToInitialSeed(session?.admin.displayName || 'Admin');
    setShowResetModal(false);
  };

  if (!isClient || !session) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-slate-400">inner-kt • Memuat Workspace Internal...</p>
        </div>
      </div>
    );
  }

  const currentTheme = getOwnerTheme(session.admin.username);

  // Compute live quick stats for topbar
  const summary = innerKtStore.getFinancialSummary();

  const navItems = [
    {
      group: 'KEUANGAN & ASET',
      items: [
        { href: '/dashboard', label: 'Dashboard & Ringkasan', icon: LayoutDashboard },
        { href: '/orders', label: 'Order Penyewaan', icon: ShoppingCart },
        { href: '/assets', label: 'Inventaris Aset & Modal', icon: Boxes },
        { href: '/expenses', label: 'Pengeluaran Bisnis', icon: Receipt },
        { href: '/analytics/finance', label: 'Grafik Keuangan & Aset', icon: BarChart3 },
      ],
    },
    {
      group: 'PELANGGAN & EVENT',
      items: [
        { href: '/crm', label: 'CRM & Calon Customer', icon: Users2 },
        { href: '/analytics/crm', label: 'Grafik Pelanggan & Event', icon: TrendingUp },
      ],
    },
    {
      group: 'SISTEM',
      items: [
        { href: '/owners', label: 'Data Pemilik', icon: UserCheck },
        { href: '/audit-log', label: 'Riwayat Audit', icon: History },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* =========================================================================
          SIDEBAR KIRI TETAP (High-Density Dark Ledger Style)
          ========================================================================= */}
      <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-xs font-mono">
                KT
              </div>
              <span className="font-bold text-white tracking-tight font-sans text-sm">
                inner-kt
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                v2.0
              </span>
            </div>
            <div className="flex items-center gap-1.5" title="Sistem Aktif - Supabase / Real-Time Store">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono text-emerald-400">Aktif</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 truncate">
            Kanal Tiga &bull; Rental Alat Event
          </p>
        </div>

        {/* Quick Perspective Switcher */}
        <div className="p-3 bg-slate-900/80 border-b border-slate-800">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
            <span>Beralih Akun Pemilik:</span>
            <Sparkles className="w-3 h-3 text-blue-400" />
          </div>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => handleQuickSwitch('admin1')}
              className={`py-1 px-1.5 text-[10px] font-mono rounded text-center transition border ${
                session.admin.username === 'admin1'
                  ? 'bg-indigo-600 text-white border-indigo-500 font-semibold shadow-xs'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              Surya
            </button>
            <button
              onClick={() => handleQuickSwitch('admin2')}
              className={`py-1 px-1.5 text-[10px] font-mono rounded text-center transition border ${
                session.admin.username === 'admin2'
                  ? 'bg-teal-600 text-white border-teal-500 font-semibold shadow-xs'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              Pemilik B
            </button>
            <button
              onClick={() => handleQuickSwitch('admin3')}
              className={`py-1 px-1.5 text-[10px] font-mono rounded text-center transition border ${
                session.admin.username === 'admin3'
                  ? 'bg-amber-600 text-white border-amber-500 font-semibold shadow-xs'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              Pemilik C
            </button>
          </div>
        </div>

        {/* Navigation Menus */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {navItems.map((group) => (
            <div key={group.group}>
              <div className="px-2 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase mb-1">
                {group.group}
              </div>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs transition ${
                          isActive
                            ? 'bg-blue-600 text-white font-medium shadow-xs'
                            : 'text-slate-300 hover:text-white hover:bg-slate-900'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0 opacity-80" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer: Active User & Reset/Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/60">
          {/* Active Admin Card */}
          <div className="flex items-center gap-2.5 p-2 rounded bg-slate-950 border border-slate-800 mb-2">
            <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs ${currentTheme.bg} ${currentTheme.text} shrink-0 border ${currentTheme.border}`}>
              {session.admin.username === 'admin1' ? 'S' : session.admin.username === 'admin2' ? 'B' : 'C'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white truncate">
                  {session.admin.displayName}
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 truncate">
                {session.admin.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowResetModal(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Reset Database ke Data Awal"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>Reset Data</span>
            </button>
            <button
              onClick={handleLogout}
              className="py-1 px-2.5 rounded text-[11px] font-mono bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 transition flex items-center gap-1"
              title="Keluar"
            >
              <LogOut className="w-3 h-3" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          MAIN CONTENT AREA & TOPBAR
          ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Operational Bar */}
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
          {/* Left: Quick Financial Ledger Metrics Strip */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="hidden lg:flex items-center gap-2 pr-4 border-r border-slate-200">
              <span className="text-slate-500 text-[11px]">Aset Bisnis:</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {summary.totalBusinessUnits} Unit
              </span>
              <span className="text-slate-400">({formatRupiah(summary.totalBusinessCapital)})</span>
            </div>

            <div className="hidden md:flex items-center gap-2 pr-4 border-r border-slate-200">
              <span className="text-slate-500 text-[11px]">Sisa Modal:</span>
              <span className="font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 tabular-nums">
                {formatRupiah(summary.totalUnrecoveredCapital)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[11px]">Profit Setelah Modal:</span>
              <span className={`font-semibold tabular-nums px-1.5 py-0.5 rounded border ${
                summary.totalBusinessProfit >= 0
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-red-700 bg-red-50 border-red-200'
              }`}>
                {formatRupiah(summary.totalBusinessProfit, true)}
              </span>
            </div>
          </div>

          {/* Right: Actions & Current Admin Pill */}
          <div className="flex items-center gap-3">
            <Link
              href="/orders/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium tracking-wide uppercase transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Order Baru</span>
            </Link>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-xs">
              <span className={`w-2 h-2 rounded-full ${currentTheme.dot}`} />
              <span className="font-medium text-slate-700 font-sans">{session.admin.displayName}</span>
              <span className="text-slate-400 text-[11px] font-mono">({session.admin.username})</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Confirmation Modal for Resetting Seed Data */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-lg max-w-md w-full p-5">
            <div className="flex items-center gap-2.5 text-amber-600 mb-2">
              <RotateCcw className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-sm text-slate-900">
                Reset Database ke Data Awal (Pristine Seed)?
              </h3>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Tindakan ini akan mengembalikan data 3 Pemilik, 30 unit HT, Order Final Dies Natalis FT, 2 Pengeluaran, dan 4 prospek CRM ke dataset acuan spesifikasi. Seluruh data baru yang ditambahkan selama pengujian akan digantikan dengan data awal.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded border border-slate-300 font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetSeed}
                className="px-3.5 py-1.5 text-xs text-white bg-slate-900 hover:bg-slate-800 rounded font-medium shadow-xs"
              >
                Ya, Reset ke Data Awal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
