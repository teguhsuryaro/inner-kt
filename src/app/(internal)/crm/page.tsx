'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { innerKtStore, subscribeToStore, getStoreSnapshot } from '@/lib/store';
import { dbService } from '@/lib/db-service';
import { getCurrentSession } from '@/lib/auth';
import { formatRupiah, formatDate, getPipelineBadge } from '@/lib/formatters';
import {
  Users2,
  Plus,
  Phone,
  Calendar,
  ExternalLink,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Tag,
  Clock,
  Briefcase,
  Instagram,
  Pencil,
  Trash2,
  Search,
  X,
  Filter,
  RotateCcw,
} from 'lucide-react';
import { PipelineStatus, OrganizationType, CrmLead, PicGender } from '@/types';

export default function CrmPage() {
  const session = getCurrentSession();

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterOrgType, setFilterOrgType] = useState<string>('ALL');
  const [filterGender, setFilterGender] = useState<string>('ALL');
  const [filterChannel, setFilterChannel] = useState<string>('ALL');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLead, setEditingLead] = useState<CrmLead | null>(null);
  const [deletingLead, setDeletingLead] = useState<CrmLead | null>(null);

  // Form State (Add & Edit)
  const [organizationName, setOrganizationName] = useState('');
  const [organizationType, setOrganizationType] = useState<OrganizationType>('BEM_HIMA_UKM');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState(1);
  const [estimatedUnits, setEstimatedUnits] = useState(15);
  const [estimatedBudget, setEstimatedBudget] = useState(150000);
  const [picName, setPicName] = useState('');
  const [picGender, setPicGender] = useState<PicGender>('TIDAK_DIKETAHUI');
  const [picRole, setPicRole] = useState('');
  const [picPhone, setPicPhone] = useState('');
  const [picInstagram, setPicInstagram] = useState('');
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>('IDENTIFIED');
  const [lossReason, setLossReason] = useState('');
  const [voucherCodeOffered, setVoucherCodeOffered] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [notes, setNotes] = useState('');
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useSyncExternalStore(
    subscribeToStore,
    getStoreSnapshot,
    () => 1
  );

  const leads = innerKtStore.getCrmLeads();
  const orders = innerKtStore.getOrders();

  // Filter Pipeline calculation
  const filteredLeads = leads.filter((l) => {
    // 1. Text Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = l.organizationName.toLowerCase().includes(q);
      const matchEvent = l.eventName.toLowerCase().includes(q);
      const matchPic = l.picName.toLowerCase().includes(q);
      const matchPhone = l.picPhone?.toLowerCase().includes(q);
      const matchIg = l.picInstagram?.toLowerCase().includes(q);
      const matchVoucher = l.voucherCodeOffered?.toLowerCase().includes(q);
      if (!matchName && !matchEvent && !matchPic && !matchPhone && !matchIg && !matchVoucher) {
        return false;
      }
    }

    // 2. Status Pipeline
    if (filterStatus !== 'ALL' && l.pipelineStatus !== filterStatus) {
      return false;
    }

    // 3. Organization Type
    if (filterOrgType !== 'ALL' && l.organizationType !== filterOrgType) {
      return false;
    }

    // 4. Gender PIC
    if (filterGender !== 'ALL' && l.picGender !== filterGender) {
      return false;
    }

    // 5. Contact Channels
    if (filterChannel === 'WA' && !l.picPhone) return false;
    if (filterChannel === 'IG' && !l.picInstagram) return false;
    if (filterChannel === 'BOTH' && (!l.picPhone || !l.picInstagram)) return false;

    return true;
  });

  const isFilterActive =
    searchQuery.trim() !== '' ||
    filterStatus !== 'ALL' ||
    filterOrgType !== 'ALL' ||
    filterGender !== 'ALL' ||
    filterChannel !== 'ALL';

  const resetAllFilters = () => {
    setSearchQuery('');
    setFilterStatus('ALL');
    setFilterOrgType('ALL');
    setFilterGender('ALL');
    setFilterChannel('ALL');
  };

  // Pipeline metrics counts & estimated budgets (including LOST)
  const pipelineMetrics = [
    { key: 'ALL', label: 'Semua Prospek', color: 'slate', count: leads.length },
    { key: 'IDENTIFIED', label: 'Target Baru', color: 'slate', count: leads.filter((l) => l.pipelineStatus === 'IDENTIFIED').length },
    { key: 'CONTACTED', label: 'Dihubungi', color: 'blue', count: leads.filter((l) => l.pipelineStatus === 'CONTACTED').length },
    { key: 'PROPOSAL_SENT', label: 'Penawaran', color: 'purple', count: leads.filter((l) => l.pipelineStatus === 'PROPOSAL_SENT').length },
    { key: 'NEGOTIATION', label: 'Negosiasi', color: 'amber', count: leads.filter((l) => l.pipelineStatus === 'NEGOTIATION').length },
    { key: 'WON', label: 'Deal / Sewa', color: 'emerald', count: leads.filter((l) => l.pipelineStatus === 'WON').length },
    { key: 'LOST', label: 'Batal', color: 'rose', count: leads.filter((l) => l.pipelineStatus === 'LOST').length },
  ];

  const cleanPhoneForWhatsApp = (rawPhone: string) => {
    const clean = rawPhone.replace(/\D/g, '');
    if (clean.startsWith('0')) {
      return `62${clean.slice(1)}`;
    }
    return clean;
  };

  const cleanInstagramHandle = (handle: string) => {
    let clean = handle.trim();
    if (clean.startsWith('@')) clean = clean.substring(1);
    if (clean.startsWith('http')) {
      const parts = clean.split('/');
      clean = parts[parts.length - 1] || parts[parts.length - 2] || clean;
    }
    return clean;
  };

  const openAddModal = () => {
    setOrganizationName('');
    setOrganizationType('BEM_HIMA_UKM');
    setEventName('');
    setEventDate('');
    setEstimatedDuration(1);
    setEstimatedUnits(15);
    setEstimatedBudget(150000);
    setPicName('');
    setPicGender('TIDAK_DIKETAHUI');
    setPicRole('');
    setPicPhone('');
    setPicInstagram('');
    setPipelineStatus('IDENTIFIED');
    setLossReason('');
    setVoucherCodeOffered('');
    setNextFollowUpDate('');
    setNotes('');
    setFormErrors([]);
    setShowAddModal(true);
  };

  const openEditModal = (lead: CrmLead) => {
    setEditingLead(lead);
    setOrganizationName(lead.organizationName);
    setOrganizationType(lead.organizationType);
    setEventName(lead.eventName);
    setEventDate(lead.eventDate ? lead.eventDate.split('T')[0] : '');
    setEstimatedDuration(lead.estimatedDuration);
    setEstimatedUnits(lead.estimatedUnits);
    setEstimatedBudget(lead.estimatedBudget || 0);
    setPicName(lead.picName);
    setPicGender(lead.picGender || 'TIDAK_DIKETAHUI');
    setPicRole(lead.picRole || '');
    setPicPhone(lead.picPhone || '');
    setPicInstagram(lead.picInstagram || '');
    setPipelineStatus(lead.pipelineStatus);
    setLossReason(lead.lossReason || '');
    setVoucherCodeOffered(lead.voucherCodeOffered || '');
    setNextFollowUpDate(lead.nextFollowUpDate ? lead.nextFollowUpDate.split('T')[0] : '');
    setNotes(lead.notes || '');
    setFormErrors([]);
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);
    setIsSubmitting(true);

    try {
      const res = await dbService.addCrmLead(
        {
          organizationName,
          organizationType,
          eventName,
          eventDate: eventDate ? new Date(eventDate).toISOString() : null,
          estimatedDuration: Number(estimatedDuration),
          estimatedUnits: Number(estimatedUnits),
          estimatedBudget: Number(estimatedBudget) || null,
          picName,
          picGender,
          picRole: picRole || null,
          picPhone: picPhone || null,
          picInstagram: picInstagram ? cleanInstagramHandle(picInstagram) : null,
          pipelineStatus,
          lossReason: pipelineStatus === 'LOST' ? (lossReason || null) : null,
          voucherCodeOffered: voucherCodeOffered ? voucherCodeOffered.toUpperCase() : null,
          nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate).toISOString() : null,
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    setFormErrors([]);
    setIsSubmitting(true);

    try {
      const res = await dbService.updateCrmLead(
        editingLead.id,
        {
          organizationName,
          organizationType,
          eventName,
          eventDate: eventDate ? new Date(eventDate).toISOString() : null,
          estimatedDuration: Number(estimatedDuration),
          estimatedUnits: Number(estimatedUnits),
          estimatedBudget: Number(estimatedBudget) || null,
          picName,
          picGender,
          picRole: picRole || null,
          picPhone: picPhone || null,
          picInstagram: picInstagram ? cleanInstagramHandle(picInstagram) : null,
          pipelineStatus,
          lossReason: pipelineStatus === 'LOST' ? (lossReason || null) : null,
          voucherCodeOffered: voucherCodeOffered ? voucherCodeOffered.toUpperCase() : null,
          nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate).toISOString() : null,
          notes: notes || null,
        },
        {
          email: session?.admin.email || 'admin1@kanaltiga.internal',
          name: session?.admin.displayName || 'Admin',
        }
      );

      if (res.success) {
        setEditingLead(null);
      } else {
        setFormErrors(['Gagal memperbarui data prospek.']);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!deletingLead) return;
    setIsSubmitting(true);
    try {
      await dbService.deleteCrmLead(deletingLead.id, {
        email: session?.admin.email || 'admin1@kanaltiga.internal',
        name: session?.admin.displayName || 'Admin',
      });
      setDeletingLead(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (leadId: string, newStatus: PipelineStatus) => {
    await dbService.updateCrmLead(
      leadId,
      { pipelineStatus: newStatus },
      {
        email: session?.admin.email || 'admin1@kanaltiga.internal',
        name: session?.admin.displayName || 'Admin',
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500">
            Pelanggan &amp; Event &bull; Pipeline CRM
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 font-sans mt-1">
            CRM Organisasi, Event &amp; Calon Pelanggan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Database prospek event kampus, voucher web Kanal Tiga, multi-kontak (WA &amp; IG), dan konversi terproteksi ke Order.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium tracking-wide uppercase transition shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Prospek Baru</span>
        </button>
      </div>

      {/* Pipeline Stages Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {pipelineMetrics.map((stage) => {
          const isSelected = filterStatus === stage.key;
          return (
            <button
              key={stage.key}
              type="button"
              onClick={() => setFilterStatus(stage.key)}
              className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span
                className={`text-[10px] font-mono font-semibold uppercase tracking-wider truncate ${
                  isSelected ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                {stage.label}
              </span>
              <div className="flex items-center justify-between mt-1">
                <span
                  className={`text-base font-bold font-mono tabular-nums ${
                    isSelected ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {stage.count}
                </span>
                {stage.key === 'WON' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Deal" />
                )}
                {stage.key === 'LOST' && (
                  <span className="w-2 h-2 rounded-full bg-rose-500" title="Batal" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Unified Structured Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-3 shadow-none">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          {/* 1. Quick Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari organisasi, event, nama PIC, WA, IG, voucher..."
              className="w-full pl-8 pr-7 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* 2. Kategori Organisasi */}
          <div>
            <select
              value={filterOrgType}
              onChange={(e) => setFilterOrgType(e.target.value)}
              className="w-full py-1.5 px-2 border border-slate-300 rounded bg-white text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="BEM_HIMA_UKM">BEM / HIMA / UKM Kampus</option>
              <option value="SEKOLAH">Sekolah / OSIS</option>
              <option value="EO_UMUM">EO / Umum</option>
              <option value="INSTANSI">Instansi / Perusahaan</option>
              <option value="KOMUNITAS">Komunitas / Hobi</option>
            </select>
          </div>

          {/* 3. Gender PIC */}
          <div>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="w-full py-1.5 px-2 border border-slate-300 rounded bg-white text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="ALL">Semua Gender PIC</option>
              <option value="LAKI_LAKI">Laki-laki (L)</option>
              <option value="PEREMPUAN">Perempuan (P)</option>
              <option value="TIDAK_DIKETAHUI">Belum Diketahui (?)</option>
            </select>
          </div>

          {/* 4. Saluran Kontak */}
          <div className="flex items-center gap-1.5">
            <select
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value)}
              className="w-full py-1.5 px-2 border border-slate-300 rounded bg-white text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="ALL">Semua Channel Kontak</option>
              <option value="WA">Ada WhatsApp</option>
              <option value="IG">Ada Instagram</option>
              <option value="BOTH">Lengkap (WA &amp; IG)</option>
            </select>

            {isFilterActive && (
              <button
                onClick={resetAllFilters}
                title="Reset semua filter"
                className="shrink-0 p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded border border-slate-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Status Pills Ribbon */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs font-mono pt-1 border-t border-slate-100">
          <span className="text-[11px] text-slate-400 font-sans mr-1 whitespace-nowrap">Status:</span>
          {pipelineMetrics.map((p) => {
            const isSelected = filterStatus === p.key;
            let activeClass = 'bg-slate-900 text-white';
            if (p.key === 'WON') activeClass = 'bg-emerald-600 text-white';
            if (p.key === 'LOST') activeClass = 'bg-rose-600 text-white';

            return (
              <button
                key={p.key}
                onClick={() => setFilterStatus(p.key)}
                className={`px-2.5 py-0.5 rounded text-[11px] transition whitespace-nowrap ${
                  isSelected
                    ? `${activeClass} font-semibold shadow-xs`
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {p.label} ({p.count})
              </button>
            );
          })}
        </div>
      </div>

      {/* High Density CRM Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <table className="finance-table">
            <thead>
              <tr>
                <th>Organisasi &amp; Acara</th>
                <th>Kategori</th>
                <th>Tgl Acara &amp; Durasi</th>
                <th>Kebutuhan HT</th>
                <th>Estimasi Nilai</th>
                <th>Kontak PIC</th>
                <th>Status Pipeline</th>
                <th>Voucher Web</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400 text-xs font-sans">
                    Tidak ada data prospek yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const badge = getPipelineBadge(lead.pipelineStatus);
                  const linkedOrder = orders.find(
                    (o) => o.crmLeadId === lead.id || o.id === lead.convertedOrderId
                  );

                  const pastOrdersCount = orders.filter(
                    (o) => o.customerOrgName.toLowerCase() === lead.organizationName.toLowerCase()
                  ).length;

                  const isWon = lead.pipelineStatus === 'WON';
                  const cleanIg = lead.picInstagram ? cleanInstagramHandle(lead.picInstagram) : null;

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/70">
                      {/* 1. Organisasi & Acara */}
                      <td className="font-medium text-slate-900">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{lead.organizationName}</span>
                          {pastOrdersCount > 0 && (
                            <span
                              className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold"
                              title={`${pastOrdersCount} kali sewa sebelumnya`}
                            >
                              Repeat ({pastOrdersCount})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                          {lead.eventName}
                        </div>
                        {lead.notes && (
                          <div className="text-[10px] text-slate-400 mt-0.5 italic line-clamp-1" title={lead.notes}>
                            &quot;{lead.notes}&quot;
                          </div>
                        )}
                        {lead.lossReason && lead.pipelineStatus === 'LOST' && (
                          <div className="text-[10px] text-rose-600 mt-0.5 font-mono">
                            Alasan batal: {lead.lossReason}
                          </div>
                        )}
                      </td>

                      {/* 2. Kategori */}
                      <td className="text-xs text-slate-600 font-mono">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700">
                          {lead.organizationType}
                        </span>
                      </td>

                      {/* 3. Tgl Acara & Durasi */}
                      <td className="text-xs text-slate-600 font-mono">
                        <div>{formatDate(lead.eventDate)}</div>
                        <div className="text-[10px] text-slate-400 font-sans">
                          {lead.estimatedDuration} Hari
                        </div>
                      </td>

                      {/* 4. Kebutuhan Unit */}
                      <td className="font-mono text-slate-900 tabular-nums">
                        {lead.estimatedUnits} Unit
                      </td>

                      {/* 5. Estimasi Nilai */}
                      <td className="font-mono font-semibold text-slate-900 tabular-nums">
                        {lead.estimatedBudget ? formatRupiah(lead.estimatedBudget) : '-'}
                      </td>

                      {/* 6. Kontak PIC (Name + Gender Chip + Role + WA + IG) */}
                      <td>
                        <div className="text-xs font-sans space-y-1">
                          {/* Row 1: Name + Gender Badge */}
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800">{lead.picName}</span>
                            {lead.picGender === 'LAKI_LAKI' && (
                              <span
                                className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200"
                                title="Gender: Laki-laki"
                              >
                                L
                              </span>
                            )}
                            {lead.picGender === 'PEREMPUAN' && (
                              <span
                                className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200"
                                title="Gender: Perempuan"
                              >
                                P
                              </span>
                            )}
                            {(!lead.picGender || lead.picGender === 'TIDAK_DIKETAHUI') && (
                              <span
                                className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-500"
                                title="Gender: Belum Diketahui"
                              >
                                ?
                              </span>
                            )}
                          </div>

                          {/* Row 2: Role */}
                          {lead.picRole && (
                            <div className="text-[11px] text-slate-500">
                              {lead.picRole}
                            </div>
                          )}

                          {/* Row 3: Actionable Contact Chips */}
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            {lead.picPhone ? (
                              <a
                                href={`https://wa.me/${cleanPhoneForWhatsApp(lead.picPhone)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`Chat WhatsApp ke ${lead.picPhone}`}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                              >
                                <Phone className="w-2.5 h-2.5 text-emerald-600" />
                                <span>{lead.picPhone}</span>
                              </a>
                            ) : null}

                            {cleanIg ? (
                              <a
                                href={`https://instagram.com/${cleanIg}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`Buka Profil Instagram @${cleanIg}`}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition"
                              >
                                <Instagram className="w-2.5 h-2.5 text-purple-600" />
                                <span>@{cleanIg}</span>
                              </a>
                            ) : null}

                            {!lead.picPhone && !cleanIg && (
                              <span className="text-[11px] text-slate-400 font-mono">-</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 7. Status Pipeline Dropdown */}
                      <td>
                        <select
                          value={lead.pipelineStatus}
                          onChange={(e) => handleQuickStatusChange(lead.id, e.target.value as PipelineStatus)}
                          className={`text-[10px] font-mono font-semibold px-2 py-1 rounded border focus:outline-none ${badge.badge}`}
                        >
                          <option value="IDENTIFIED">Target Baru</option>
                          <option value="CONTACTED">Sudah Dihubungi</option>
                          <option value="PROPOSAL_SENT">Penawaran Dikirim</option>
                          <option value="NEGOTIATION">Negosiasi</option>
                          <option value="WON">Deal / Sewa</option>
                          <option value="LOST">Batal</option>
                        </select>
                      </td>

                      {/* 8. Voucher Web */}
                      <td>
                        {lead.voucherCodeOffered ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                            <Tag className="w-3 h-3 text-purple-600" />
                            {lead.voucherCodeOffered}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-mono">-</span>
                        )}
                      </td>

                      {/* 9. Kolom Aksi Berbasis Ikon Ramping (32x32) */}
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* 1. Ikon Konversi ke Order: STRICT RULE - Deal Only */}
                          {isWon ? (
                            linkedOrder ? (
                              <Link
                                href="/orders"
                                title={`Sudah dikonversi ke ${linkedOrder.orderNumber}`}
                                className="h-8 w-8 rounded flex items-center justify-center bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                              >
                                <ArrowRight className="w-4 h-4" />
                              </Link>
                            ) : (
                              <Link
                                href={`/orders/new?fromLeadId=${lead.id}`}
                                title="Konversi prospek Deal ini langsung ke Order Sewa"
                                className="h-8 w-8 rounded flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 shadow-xs transition"
                              >
                                <Briefcase className="w-4 h-4" />
                              </Link>
                            )
                          ) : (
                            <button
                              disabled
                              title="Ubah status pipeline menjadi Deal (WON) terlebih dahulu untuk membuat Order"
                              className="h-8 w-8 rounded flex items-center justify-center bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed"
                            >
                              <Briefcase className="w-4 h-4" />
                            </button>
                          )}

                          {/* 2. Ikon Edit Prospek */}
                          <button
                            onClick={() => openEditModal(lead)}
                            title="Edit Data Prospek"
                            className="h-8 w-8 rounded flex items-center justify-center bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* 3. Ikon Hapus Prospek */}
                          <button
                            onClick={() => setDeletingLead(lead)}
                            title="Hapus Data Prospek"
                            className="h-8 w-8 rounded flex items-center justify-center bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition"
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

      {/* Modal Tambah Prospek Baru */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 font-sans">
                  Tambah Prospek Calon Pelanggan / Event Baru
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Isi data organisasi dan kontak panitia (WhatsApp &amp; Instagram opsional).
                </p>
              </div>
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

            <form onSubmit={handleAddLead} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Organisasi / Instansi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Contoh: BEM FT Unsoed"
                    required
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kategori Organisasi
                  </label>
                  <select
                    value={organizationType}
                    onChange={(e) => setOrganizationType(e.target.value as OrganizationType)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="BEM_HIMA_UKM">BEM / HIMA / UKM Kampus</option>
                    <option value="SEKOLAH">Sekolah / OSIS</option>
                    <option value="EO_UMUM">Event Organizer / Umum</option>
                    <option value="INSTANSI">Instansi / Perusahaan</option>
                    <option value="KOMUNITAS">Komunitas / Hobi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Acara / Event <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Contoh: Malam Keakraban Teknik 2026"
                  required
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Rencana Acara
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Estimasi Durasi (Hari)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                    required
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Estimasi Kebutuhan Unit
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={estimatedUnits}
                    onChange={(e) => setEstimatedUnits(Number(e.target.value))}
                    required
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Estimasi Nilai Sewa (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={estimatedBudget}
                    onChange={(e) => setEstimatedBudget(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Data PIC & Kontak */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-3">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-600 block">
                  Informasi PIC &amp; Saluran Kontak
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nama PIC Panitia <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={picName}
                      onChange={(e) => setPicName(e.target.value)}
                      placeholder="Contoh: Raka Pratama"
                      required
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Gender PIC
                    </label>
                    <select
                      value={picGender}
                      onChange={(e) => setPicGender(e.target.value as PicGender)}
                      className="w-full text-xs px-2 py-2 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      <option value="LAKI_LAKI">Laki-laki (L)</option>
                      <option value="PEREMPUAN">Perempuan (P)</option>
                      <option value="TIDAK_DIKETAHUI">Belum Tahu (?)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Jabatan di Acara
                    </label>
                    <input
                      type="text"
                      value={picRole}
                      onChange={(e) => setPicRole(e.target.value)}
                      placeholder="Koor Perkap"
                      className="w-full text-xs px-2 py-2 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      No. WhatsApp <span className="text-slate-400 font-normal">(Opsional)</span>
                    </label>
                    <input
                      type="text"
                      value={picPhone}
                      onChange={(e) => setPicPhone(e.target.value)}
                      placeholder="081234567890"
                      className="w-full text-xs px-2 py-2 border border-slate-300 rounded bg-white font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Instagram <span className="text-slate-400 font-normal">(Opsional)</span>
                    </label>
                    <input
                      type="text"
                      value={picInstagram}
                      onChange={(e) => setPicInstagram(e.target.value)}
                      placeholder="@username"
                      className="w-full text-xs px-2 py-2 border border-slate-300 rounded bg-white font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Status & Kode Voucher */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Status Pipeline
                  </label>
                  <select
                    value={pipelineStatus}
                    onChange={(e) => setPipelineStatus(e.target.value as PipelineStatus)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="IDENTIFIED">Target Baru (Belum Dihubungi)</option>
                    <option value="CONTACTED">Sudah Dihubungi</option>
                    <option value="PROPOSAL_SENT">Penawaran Dikirim</option>
                    <option value="NEGOTIATION">Sedang Negosiasi</option>
                    <option value="WON">Deal / Sewa</option>
                    <option value="LOST">Batal</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kode Voucher (Web Utama KT)
                  </label>
                  <input
                    type="text"
                    value={voucherCodeOffered}
                    onChange={(e) => setVoucherCodeOffered(e.target.value)}
                    placeholder="Contoh: EVENT-KT26"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono uppercase focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              {pipelineStatus === 'LOST' && (
                <div>
                  <label className="block font-semibold text-rose-700 mb-1">
                    Alasan Batal / Lost
                  </label>
                  <input
                    type="text"
                    value={lossReason}
                    onChange={(e) => setLossReason(e.target.value)}
                    placeholder="Contoh: Anggaran panitia tidak mencukupi, event diundur..."
                    className="w-full text-xs px-3 py-2 border border-rose-300 rounded bg-rose-50/40 focus:outline-none focus:ring-1 focus:ring-rose-600"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Prospek (Opsional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Riwayat pembicaraan, jenis alat yang diminta panitia..."
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
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs text-white bg-slate-900 hover:bg-slate-800 rounded font-medium shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Prospek'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Prospek */}
      {editingLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 font-sans">
                  Edit Data Prospek Calon Pelanggan
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Setiap perubahan akan dicatat ke Riwayat Audit.
                </p>
              </div>
              <button
                onClick={() => setEditingLead(null)}
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

            <form onSubmit={handleUpdateLead} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Organisasi / Instansi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    required
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kategori Organisasi
                  </label>
                  <select
                    value={organizationType}
                    onChange={(e) => setOrganizationType(e.target.value as OrganizationType)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="BEM_HIMA_UKM">BEM / HIMA / UKM Kampus</option>
                    <option value="SEKOLAH">Sekolah / OSIS</option>
                    <option value="EO_UMUM">Event Organizer / Umum</option>
                    <option value="INSTANSI">Instansi / Perusahaan</option>
                    <option value="KOMUNITAS">Komunitas / Hobi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Acara / Event <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Rencana Acara
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Estimasi Durasi (Hari)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                    required
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Estimasi Kebutuhan Unit
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={estimatedUnits}
                    onChange={(e) => setEstimatedUnits(Number(e.target.value))}
                    required
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Estimasi Nilai Sewa (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={estimatedBudget}
                    onChange={(e) => setEstimatedBudget(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Data PIC & Kontak */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-3">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-600 block">
                  Informasi PIC &amp; Saluran Kontak
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nama PIC Panitia <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={picName}
                      onChange={(e) => setPicName(e.target.value)}
                      required
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Gender PIC
                    </label>
                    <select
                      value={picGender}
                      onChange={(e) => setPicGender(e.target.value as PicGender)}
                      className="w-full text-xs px-2 py-2 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      <option value="LAKI_LAKI">Laki-laki (L)</option>
                      <option value="PEREMPUAN">Perempuan (P)</option>
                      <option value="TIDAK_DIKETAHUI">Belum Tahu (?)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Jabatan di Acara
                    </label>
                    <input
                      type="text"
                      value={picRole}
                      onChange={(e) => setPicRole(e.target.value)}
                      placeholder="Koor Perkap"
                      className="w-full text-xs px-2 py-2 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      No. WhatsApp
                    </label>
                    <input
                      type="text"
                      value={picPhone}
                      onChange={(e) => setPicPhone(e.target.value)}
                      placeholder="081234567890"
                      className="w-full text-xs px-2 py-2 border border-slate-300 rounded bg-white font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Instagram
                    </label>
                    <input
                      type="text"
                      value={picInstagram}
                      onChange={(e) => setPicInstagram(e.target.value)}
                      placeholder="@username"
                      className="w-full text-xs px-2 py-2 border border-slate-300 rounded bg-white font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Status & Kode Voucher */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Status Pipeline
                  </label>
                  <select
                    value={pipelineStatus}
                    onChange={(e) => setPipelineStatus(e.target.value as PipelineStatus)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="IDENTIFIED">Target Baru (Belum Dihubungi)</option>
                    <option value="CONTACTED">Sudah Dihubungi</option>
                    <option value="PROPOSAL_SENT">Penawaran Dikirim</option>
                    <option value="NEGOTIATION">Sedang Negosiasi</option>
                    <option value="WON">Deal / Sewa</option>
                    <option value="LOST">Batal</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kode Voucher (Web Utama KT)
                  </label>
                  <input
                    type="text"
                    value={voucherCodeOffered}
                    onChange={(e) => setVoucherCodeOffered(e.target.value)}
                    placeholder="Contoh: EVENT-KT26"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono uppercase focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              {pipelineStatus === 'LOST' && (
                <div>
                  <label className="block font-semibold text-rose-700 mb-1">
                    Alasan Batal / Lost
                  </label>
                  <input
                    type="text"
                    value={lossReason}
                    onChange={(e) => setLossReason(e.target.value)}
                    placeholder="Contoh: Anggaran panitia tidak mencukupi, event diundur..."
                    className="w-full text-xs px-3 py-2 border border-rose-300 rounded bg-rose-50/40 focus:outline-none focus:ring-1 focus:ring-rose-600"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Prospek (Opsional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Riwayat pembicaraan, jenis alat yang diminta panitia..."
                  rows={2}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingLead(null)}
                  className="px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded border border-slate-300 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs text-white bg-slate-900 hover:bg-slate-800 rounded font-medium shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Perbarui Prospek'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Prospek */}
      {deletingLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-slate-900 font-sans">
                  Konfirmasi Hapus Data Prospek
                </h3>
                <p className="text-xs text-slate-600">
                  Apakah Anda yakin ingin menghapus data prospek{' '}
                  <strong className="text-slate-900">{deletingLead.organizationName}</strong> &bull;{' '}
                  <span className="italic">{deletingLead.eventName}</span> (PIC: {deletingLead.picName})?
                </p>
                <p className="text-[11px] text-slate-400 mt-2">
                  Tindakan ini akan dicatat di Riwayat Audit dan data prospek tidak dapat dipulihkan.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDeletingLead(null)}
                className="px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded border border-slate-300 font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteLead}
                disabled={isSubmitting}
                className="px-4 py-1.5 text-xs text-white bg-rose-600 hover:bg-rose-700 rounded font-medium shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Prospek'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
