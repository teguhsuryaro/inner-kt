'use client';

import { useState, useMemo, useSyncExternalStore } from 'react';
import { innerKtStore, subscribeToStore, getStoreSnapshot } from '@/lib/store';
import { dbService } from '@/lib/db-service';
import { getCurrentSession } from '@/lib/auth';
import { formatRupiah, formatDate, getOwnerTheme } from '@/lib/formatters';
import {
  Plus,
  Filter,
  Boxes,
  AlertCircle,
  Pencil,
  Trash2,
  AlertTriangle,
  FileEdit,
  X,
  Check,
} from 'lucide-react';
import { Asset } from '@/types';

export default function AssetsPage() {
  const session = getCurrentSession();
  const [selectedOwnerFilter, setSelectedOwnerFilter] = useState<string>('ALL');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);

  // Form states (Add & Edit)
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Handy Talky (HT)');
  const [ownerId, setOwnerId] = useState('11111111-1111-1111-1111-111111111111');
  const [quantity, setQuantity] = useState(1);
  const [capitalPerUnit, setCapitalPerUnit] = useState(100000);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [isInitialCapital, setIsInitialCapital] = useState(false);
  const [notes, setNotes] = useState('');
  const [editReason, setEditReason] = useState('');
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);

  useSyncExternalStore(
    subscribeToStore,
    getStoreSnapshot,
    () => 1
  );

  const owners = innerKtStore.getOwners();
  const assets = innerKtStore.getAssets();

  // Distinct category suggestions for datalist
  const categorySuggestions = useMemo(() => {
    const set = new Set<string>([
      'Handy Talky (HT)',
      'Aksesoris Audio',
      'Perangkat Daya',
      'Perlengkapan Event',
      'Audio & Sound Portable',
      'Lampu & Penerangan',
      'Tenda & Terpal',
    ]);
    assets.forEach((a) => {
      if (a.category) set.add(a.category);
    });
    return Array.from(set);
  }, [assets]);

  const filteredAssets =
    selectedOwnerFilter === 'ALL'
      ? assets
      : assets.filter((a) => a.ownerId === selectedOwnerFilter);

  const totalUnits = filteredAssets.reduce((sum, a) => sum + a.quantity, 0);
  const totalCapitalVal = filteredAssets.reduce((sum, a) => sum + a.totalCapital, 0);

  const openAddModal = () => {
    setName('');
    setCategory('Handy Talky (HT)');
    setOwnerId(owners[0]?.id || '11111111-1111-1111-1111-111111111111');
    setQuantity(1);
    setCapitalPerUnit(100000);
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setIsInitialCapital(false);
    setNotes('');
    setFormErrors([]);
    setShowAddModal(true);
  };

  const openEditModal = (asset: Asset) => {
    setEditingAsset(asset);
    setName(asset.name);
    setCategory(asset.category);
    setOwnerId(asset.ownerId);
    setQuantity(asset.quantity);
    setCapitalPerUnit(asset.capitalPerUnit);
    setPurchaseDate(asset.purchaseDate);
    setIsInitialCapital(asset.isInitialCapital);
    setNotes(asset.notes || '');
    setEditReason('');
    setFormErrors([]);
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);

    const res = await dbService.addAsset(
      {
        name,
        category,
        ownerId,
        quantity: Number(quantity),
        capitalPerUnit: Number(capitalPerUnit),
        purchaseDate,
        isInitialCapital,
        notes: notes || null,
      },
      {
        email: session?.admin.email || 'admin1@kanaltiga.internal',
        name: session?.admin.displayName || 'Admin',
      }
    );

    if (res.success) {
      setShowAddModal(false);
    } else if (res.errors) {
      setFormErrors(res.errors);
    }
  };

  const handleUpdateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
    setFormErrors([]);

    const res = await dbService.updateAsset(
      editingAsset.id,
      {
        name,
        category,
        ownerId,
        quantity: Number(quantity),
        capitalPerUnit: Number(capitalPerUnit),
        purchaseDate,
        isInitialCapital,
        notes: notes || null,
      },
      {
        email: session?.admin.email || 'admin1@kanaltiga.internal',
        name: session?.admin.displayName || 'Admin',
      },
      editReason
    );

    if (res.success) {
      setEditingAsset(null);
    } else if (res.errors) {
      setFormErrors(res.errors);
    }
  };

  const handleDeleteAsset = async () => {
    if (!deletingAsset) return;
    setActionError(null);

    const res = await dbService.deleteAsset(deletingAsset.id, {
      email: session?.admin.email || 'admin1@kanaltiga.internal',
      name: session?.admin.displayName || 'Admin',
    });

    if (res.success) {
      setDeletingAsset(null);
    } else {
      setActionError(res.error || 'Gagal menghapus aset.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500">
            Inventaris &bull; Kepemilikan Barang v2.0
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 font-sans mt-1">
            Inventaris Aset &amp; Modal Pemilik
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar seluruh unit HT, audio, dan alat event. Kategori bebas, seluruh barang siap pakai, dan perubahan tercatat di Audit Log.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium tracking-wide uppercase transition shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Aset Baru</span>
        </button>
      </div>

      {/* Filter and Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200">
        {/* Owner Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs font-mono">
          <span className="text-slate-400 mr-1.5 flex items-center gap-1 text-[11px]">
            <Filter className="w-3 h-3" />
            <span>Filter:</span>
          </span>
          <button
            onClick={() => setSelectedOwnerFilter('ALL')}
            className={`px-3 py-1 rounded transition whitespace-nowrap ${
              selectedOwnerFilter === 'ALL'
                ? 'bg-slate-900 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Pemilik ({assets.length} Aset)
          </button>
          {owners.map((owner) => {
            const theme = getOwnerTheme(owner.code);
            const isSelected = selectedOwnerFilter === owner.id;
            const count = assets.filter((a) => a.ownerId === owner.id).length;
            return (
              <button
                key={owner.id}
                onClick={() => setSelectedOwnerFilter(owner.id)}
                className={`px-3 py-1 rounded transition whitespace-nowrap border ${
                  isSelected
                    ? `${theme.bg} ${theme.text} ${theme.border} font-bold`
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {owner.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Quick Counts */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-400">Total Unit: </span>
            <span className="font-bold text-slate-900 tabular-nums">{totalUnits} Unit</span>
          </div>
          <div>
            <span className="text-slate-400">Total Modal: </span>
            <span className="font-bold text-slate-900 tabular-nums">{formatRupiah(totalCapitalVal)}</span>
          </div>
        </div>
      </div>

      {/* Datalist for Category Suggestions */}
      <datalist id="category-suggestions">
        {categorySuggestions.map((cat) => (
          <option key={cat} value={cat} />
        ))}
      </datalist>

      {/* High Density Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <table className="finance-table">
            <thead>
              <tr>
                <th>Nama Barang / Aset</th>
                <th>Kategori (Manual)</th>
                <th>Pemilik</th>
                <th>Jumlah Unit</th>
                <th>Modal / Unit</th>
                <th>Total Nilai Modal</th>
                <th>Jenis Modal</th>
                <th>Tanggal Catat</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                        <Boxes className="w-6 h-6 stroke-[1.5]" />
                      </div>
                      <h4 className="font-semibold text-slate-800 text-sm mb-1">
                        Inventaris Aset Masih Kosong
                      </h4>
                      <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                        Belum ada barang atau modal unit yang dicatat. Klik tombol di bawah untuk mulai mencatat inventaris milik masing-masing pemilik.
                      </p>
                      <button
                        onClick={openAddModal}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Aset Perdana</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => {
                  const owner = owners.find((o) => o.id === asset.ownerId);
                  const theme = getOwnerTheme(owner?.code || '');
                  return (
                    <tr key={asset.id} className="hover:bg-slate-50/70">
                      <td className="font-medium text-slate-900">
                        <div>{asset.name}</div>
                        {asset.notes && (
                          <div className="text-[11px] text-slate-400 font-normal">{asset.notes}</div>
                        )}
                      </td>
                      <td className="text-xs text-slate-700 font-mono">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {asset.category}
                        </span>
                      </td>
                      <td>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold border ${theme.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                          {owner?.name || asset.ownerId}
                        </span>
                      </td>
                      <td className="font-mono font-bold text-slate-900 tabular-nums">
                        {asset.quantity} Unit
                      </td>
                      <td className="font-mono text-slate-700 tabular-nums">
                        {formatRupiah(asset.capitalPerUnit)}
                      </td>
                      <td className="font-mono font-bold text-slate-900 tabular-nums">
                        {formatRupiah(asset.totalCapital)}
                      </td>
                      <td>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-medium ${
                          asset.isInitialCapital
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}>
                          {asset.isInitialCapital ? 'Modal Awal' : 'Modal Tambahan'}
                        </span>
                      </td>
                      <td className="text-xs text-slate-500 font-mono">
                        {formatDate(asset.purchaseDate)}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(asset)}
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded transition border border-transparent hover:border-blue-200"
                            title="Edit Data Aset"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setActionError(null);
                              setDeletingAsset(asset);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded transition border border-transparent hover:border-red-200"
                            title="Hapus Aset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Aset Baru */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-[calc(100vw-2rem)] sm:max-w-lg p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-sm text-slate-900 font-sans">
                Tambah Aset / Inventaris Baru
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-mono"
              >
                &times;
              </button>
            </div>

            {formErrors.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 space-y-1">
                {formErrors.map((err, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddAsset} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Barang / Aset <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Megaphone Toa ZR-2015W / HT Baofeng UV-9R"
                  required
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kategori Barang (Bebas / Ketik Manual) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    list="category-suggestions"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Ketik kategori bebas..."
                    required
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Bebas diisi apa saja (misal: HT, Audio, Tenda, Kabel)
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Pemilik Aset <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
                  >
                    {owners.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jumlah Unit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    required
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Harga Modal / Unit (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={capitalPerUnit}
                    onChange={(e) => setCapitalPerUnit(Number(e.target.value))}
                    required
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded flex justify-between items-center font-mono">
                <span className="text-slate-500">Total Nilai Modal Terhitung:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {formatRupiah(quantity * capitalPerUnit)}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tanggal Pembelian / Pencatatan
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={isInitialCapital}
                    onChange={(e) => setIsInitialCapital(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span className="text-slate-700 font-medium">
                    Tandai sebagai <strong>Modal Awal</strong> (uncheck jika Modal Tambahan)
                  </span>
                </label>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Keterangan kelengkapan atau tempat penyimpanan..."
                  rows={2}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded border border-slate-300 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs text-white bg-slate-900 hover:bg-slate-800 rounded font-medium shadow-xs"
                >
                  Simpan Aset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Aset */}
      {editingAsset && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-[calc(100vw-2rem)] sm:max-w-lg p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <FileEdit className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900 font-sans">
                  Edit Data Aset ({editingAsset.name})
                </h3>
              </div>
              <button
                onClick={() => setEditingAsset(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-mono"
              >
                &times;
              </button>
            </div>

            {formErrors.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 space-y-1">
                {formErrors.map((err, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleUpdateAsset} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Barang / Aset <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kategori Barang (Manual) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    list="category-suggestions"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Pemilik Aset <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
                  >
                    {owners.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jumlah Unit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    required
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Harga Modal / Unit (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={capitalPerUnit}
                    onChange={(e) => setCapitalPerUnit(Number(e.target.value))}
                    required
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded flex justify-between items-center font-mono">
                <span className="text-slate-500">Total Nilai Modal Baru:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {formatRupiah(quantity * capitalPerUnit)}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tanggal Pembelian / Pencatatan
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={isInitialCapital}
                    onChange={(e) => setIsInitialCapital(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span className="text-slate-700 font-medium">
                    Tandai sebagai <strong>Modal Awal</strong> (uncheck jika Modal Tambahan)
                  </span>
                </label>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alasan Perubahan (Tercatat di Audit Log)
                </label>
                <input
                  type="text"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Misal: Koreksi salah ketik harga modal unit..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingAsset(null)}
                  className="px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded border border-slate-300 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs text-white bg-slate-900 hover:bg-slate-800 rounded font-medium shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Aset */}
      {deletingAsset && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-[calc(100vw-2rem)] sm:max-w-md p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2.5 text-red-600 mb-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-sm text-slate-900 font-sans">
                Hapus Aset &quot;{deletingAsset.name}&quot;?
              </h3>
            </div>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Aset ini memiliki <strong>{deletingAsset.quantity} unit</strong> dengan nilai total modal{' '}
              <strong>{formatRupiah(deletingAsset.totalCapital)}</strong>. Penghapusan aset akan otomatis tercatat di Riwayat Audit.
            </p>

            {actionError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingAsset(null)}
                className="px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded border border-slate-300 font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteAsset}
                className="px-3.5 py-1.5 text-xs text-white bg-red-600 hover:bg-red-700 rounded font-medium shadow-xs"
              >
                Ya, Hapus Aset Ini
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
