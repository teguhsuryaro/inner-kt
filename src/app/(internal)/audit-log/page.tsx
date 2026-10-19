'use client';

import { useState, useSyncExternalStore } from 'react';
import { innerKtStore, subscribeToStore, getStoreSnapshot } from '@/lib/store';
import { formatDateTime, getOwnerTheme } from '@/lib/formatters';
import { History, Shield, Filter, Code2, CheckCircle2 } from 'lucide-react';
import { AuditLog } from '@/types';

export default function AuditLogPage() {
  const [filterEntity, setFilterEntity] = useState<string>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useSyncExternalStore(
    subscribeToStore,
    getStoreSnapshot,
    () => 1
  );

  const logs = innerKtStore.getAuditLogs();

  const filteredLogs = logs.filter((l) => {
    if (filterEntity === 'ALL') return true;
    return l.entityType === filterEntity;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500">
            Kepatuhan &amp; Integritas &bull; Audit Trail
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 font-sans mt-1">
            Riwayat Jejak Audit Transaksi &amp; Sistem
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Setiap aksi penambahan aset, finalisasi/pembatalan order, pengeluaran, dan perubahan status tercatat permanen beserta akun admin pelaksana.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto text-xs font-mono bg-white p-2 rounded-lg border border-slate-200">
        <button
          onClick={() => setFilterEntity('ALL')}
          className={`px-3 py-1 rounded transition whitespace-nowrap ${
            filterEntity === 'ALL'
              ? 'bg-slate-900 text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Semua Aktivitas ({logs.length})
        </button>
        <button
          onClick={() => setFilterEntity('ORDER')}
          className={`px-3 py-1 rounded transition whitespace-nowrap ${
            filterEntity === 'ORDER'
              ? 'bg-slate-900 text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Order Penyewaan
        </button>
        <button
          onClick={() => setFilterEntity('EXPENSE')}
          className={`px-3 py-1 rounded transition whitespace-nowrap ${
            filterEntity === 'EXPENSE'
              ? 'bg-slate-900 text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Pengeluaran
        </button>
        <button
          onClick={() => setFilterEntity('ASSET')}
          className={`px-3 py-1 rounded transition whitespace-nowrap ${
            filterEntity === 'ASSET'
              ? 'bg-slate-900 text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Aset &amp; Modal
        </button>
        <button
          onClick={() => setFilterEntity('CRM_LEAD')}
          className={`px-3 py-1 rounded transition whitespace-nowrap ${
            filterEntity === 'CRM_LEAD'
              ? 'bg-slate-900 text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          CRM &amp; Prospek
        </button>
        <button
          onClick={() => setFilterEntity('SYSTEM')}
          className={`px-3 py-1 rounded transition whitespace-nowrap ${
            filterEntity === 'SYSTEM'
              ? 'bg-slate-900 text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Sistem &amp; Reset
        </button>
      </div>

      {/* High Density Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <table className="finance-table">
            <thead>
              <tr>
                <th>Waktu Transaksi</th>
                <th>Akun Pelaksana</th>
                <th>Tipe Entitas</th>
                <th>Aksi</th>
                <th>Ringkasan Aktivitas</th>
                <th className="text-right">Payload</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                    Belum ada riwayat audit pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const theme = getOwnerTheme(log.adminEmail || '');
                  const isExpanded = expandedLogId === log.id;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="text-xs text-slate-500 font-mono whitespace-nowrap">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${theme.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                          {log.adminDisplayName || log.adminEmail}
                        </span>
                      </td>
                      <td>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                          {log.entityType}
                        </span>
                      </td>
                      <td>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold border ${
                          log.action.includes('FINALIZE') || log.action.includes('CREATE')
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : log.action.includes('DELETE') || log.action.includes('CANCEL')
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="text-xs text-slate-800 font-sans max-w-md">
                        {log.summary}
                        {isExpanded && (log.beforeJson || log.afterJson) && (
                          <div className="mt-2 p-2 rounded bg-slate-900 text-slate-200 text-[10px] font-mono overflow-x-auto max-h-48 space-y-2">
                            {log.beforeJson && (
                              <div>
                                <span className="text-red-400 block font-bold mb-0.5">SEBELUM (Before):</span>
                                <pre>{JSON.stringify(log.beforeJson, null, 2)}</pre>
                              </div>
                            )}
                            {log.afterJson && (
                              <div>
                                <span className="text-emerald-400 block font-bold mb-0.5">SESUDAH (After):</span>
                                <pre>{JSON.stringify(log.afterJson, null, 2)}</pre>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="text-right">
                        {(log.beforeJson || log.afterJson) ? (
                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="p-1 text-slate-500 hover:text-slate-800 text-[10px] font-mono inline-flex items-center gap-1 border border-slate-200 rounded px-1.5 py-0.5"
                          >
                            <Code2 className="w-3 h-3" />
                            <span>{isExpanded ? 'Tutup' : 'Detail'}</span>
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xs font-mono">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
