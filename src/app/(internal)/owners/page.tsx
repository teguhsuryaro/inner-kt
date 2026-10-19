'use client';

import { useState, useSyncExternalStore } from 'react';
import { innerKtStore, subscribeToStore, getStoreSnapshot } from '@/lib/store';
import { getCurrentSession } from '@/lib/auth';
import { formatRupiah, getOwnerTheme } from '@/lib/formatters';
import { UserCheck, Edit2, Check, X, Shield, Calendar, Boxes } from 'lucide-react';

export default function OwnersPage() {
  const session = getCurrentSession();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  useSyncExternalStore(
    subscribeToStore,
    getStoreSnapshot,
    () => 1
  );

  const owners = innerKtStore.getOwners();
  const summary = innerKtStore.getFinancialSummary();

  const handleStartEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
    setMsg(null);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    const ok = innerKtStore.updateOwnerName(id, editName, {
      id: session?.admin.id || 'admin-1',
      email: session?.admin.email || 'admin1@kanaltiga.internal',
      name: session?.admin.displayName || 'Admin',
    });
    if (ok) {
      setMsg(`Nama pemilik berhasil diperbarui.`);
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500">
            Sistem &bull; Konfigurasi Entitas
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 font-sans mt-1">
            Data Pemilik Bisnis Kanal Tiga
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengaturan profil 3 pemilik bisnis. Perubahan nama tampilan tidak merusak relasi historis order atau aset.
          </p>
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded font-medium">
          {msg}
        </div>
      )}

      {/* Owners Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {owners.map((owner) => {
          const ownerSummary = summary.owners.find((o) => o.ownerId === owner.id);
          const theme = getOwnerTheme(owner.code);
          const isEditing = editingId === owner.id;

          return (
            <div
              key={owner.id}
              className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-none"
            >
              <div className={`p-4 border-b ${theme.border} ${theme.bg} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${theme.dot}`} />
                  <span className="text-xs font-mono font-bold uppercase text-slate-700">
                    {owner.code}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-emerald-700 border border-emerald-200 font-semibold">
                  {owner.isActive ? 'AKTIF' : 'NONAKTIF'}
                </span>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                    Nama Tampilan Pemilik
                  </label>
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="text-sm px-2.5 py-1 border border-slate-300 rounded font-semibold text-slate-900 w-full focus:outline-none focus:ring-1 focus:ring-slate-900"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(owner.id)}
                        className="p-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                        title="Simpan"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded bg-slate-200 text-slate-700 hover:bg-slate-300"
                        title="Batal"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-slate-900 font-sans">
                        {owner.name}
                      </span>
                      <button
                        onClick={() => handleStartEdit(owner.id, owner.name)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                        title="Ubah Nama Tampilan"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Jumlah Unit Aset:</span>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {ownerSummary?.totalUnitsOwned || 0} Unit
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Modal Aset:</span>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {formatRupiah(ownerSummary?.totalCapital || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pendapatan Bersih Order:</span>
                    <span className="font-mono font-semibold text-emerald-700 tabular-nums">
                      {formatRupiah(ownerSummary?.netOrderRevenue || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sisa Modal Belum Kembali:</span>
                    <span className="font-mono font-semibold text-amber-700 tabular-nums">
                      {formatRupiah(ownerSummary?.unrecoveredCapital || 0)}
                    </span>
                  </div>
                </div>

                {owner.notes && (
                  <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
                    {owner.notes}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
