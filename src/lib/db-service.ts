// ============================================================================
// inner-kt v2.0 — Supabase Service Layer (Equal Co-Owners Architecture)
// Direct Supabase Client Integration with Automatic Audit Logging & Local Fallback
// ============================================================================

import { supabase, isSupabaseConfigured } from './supabase';
import { innerKtStore } from './store';
import {
  Owner,
  AdminUser,
  Asset,
  RentalOrder,
  OrderItemOwnerUsage,
  OrderOwnerAllocation,
  Expense,
  ExpenseOwnerAllocation,
  CrmLead,
  AuditLog,
  BusinessFinancialSummary,
  OrderFormInput,
  OrderStatus,
} from '@/types';

export const dbService = {
  // OWNERS
  async getOwners(): Promise<Owner[]> {
    if (!isSupabaseConfigured || !supabase) {
      return innerKtStore.getOwners();
    }
    try {
      const { data, error } = await supabase.from('owners').select('*').order('code');
      if (error || !data || data.length === 0) return innerKtStore.getOwners();
      return data.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        colorBadge: row.color_badge,
        isActive: row.is_active,
        joinedAt: row.joined_at,
        notes: row.notes,
      }));
    } catch {
      return innerKtStore.getOwners();
    }
  },

  async updateOwnerName(
    id: string,
    newName: string,
    admin: { email: string; name: string }
  ): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
      return innerKtStore.updateOwnerName(id, newName, admin);
    }
    try {
      const { data: before } = await supabase.from('owners').select('*').eq('id', id).single();
      const { error } = await supabase.from('owners').update({ name: newName.trim() }).eq('id', id);
      if (error) return innerKtStore.updateOwnerName(id, newName, admin);

      await this.addAuditLog({
        adminEmail: admin.email,
        adminDisplayName: admin.name,
        entityType: 'OWNER',
        entityId: id,
        action: 'UPDATE',
        summary: `${admin.name} mengubah nama tampilan pemilik "${before?.name || id}" menjadi "${newName.trim()}".`,
        beforeJson: before,
        afterJson: { ...before, name: newName.trim() },
      });
      return true;
    } catch {
      return innerKtStore.updateOwnerName(id, newName, admin);
    }
  },

  // ASSETS
  async getAssets(): Promise<Asset[]> {
    if (!isSupabaseConfigured || !supabase) {
      return innerKtStore.getAssets();
    }
    try {
      const { data, error } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
      if (error || !data) return innerKtStore.getAssets();
      return data.map((row) => ({
        id: row.id,
        name: row.name,
        category: row.category,
        ownerId: row.owner_id,
        quantity: row.quantity,
        capitalPerUnit: Number(row.capital_per_unit),
        totalCapital: Number(row.total_capital),
        purchaseDate: row.purchase_date,
        isInitialCapital: row.is_initial_capital,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch {
      return innerKtStore.getAssets();
    }
  },

  async addAsset(
    assetData: Omit<Asset, 'id' | 'createdAt' | 'updatedAt' | 'totalCapital'>,
    admin: { email: string; name: string }
  ): Promise<{ success: boolean; asset?: Asset; errors?: string[] }> {
    // Keep local store in sync
    const localRes = innerKtStore.addAsset(assetData, admin);

    if (isSupabaseConfigured && supabase && localRes.success && localRes.asset) {
      try {
        const totalCapital = assetData.quantity * assetData.capitalPerUnit;
        await supabase.from('assets').insert({
          name: assetData.name,
          category: assetData.category,
          owner_id: assetData.ownerId,
          quantity: assetData.quantity,
          capital_per_unit: assetData.capitalPerUnit,
          total_capital: totalCapital,
          purchase_date: assetData.purchaseDate,
          is_initial_capital: assetData.isInitialCapital,
          notes: assetData.notes,
        });

        await this.addAuditLog({
          adminEmail: admin.email,
          adminDisplayName: admin.name,
          entityType: 'ASSET',
          entityId: localRes.asset.id,
          action: 'CREATE',
          summary: `${admin.name} menambahkan aset "${assetData.name}" (${assetData.category}) sebanyak ${assetData.quantity} unit @ Rp${assetData.capitalPerUnit.toLocaleString('id-ID')}.`,
          beforeJson: null,
          afterJson: localRes.asset,
        });
      } catch (err) {
        console.error('Supabase asset insert fallback error:', err);
      }
    }

    return localRes;
  },

  async updateAsset(
    id: string,
    assetData: Partial<Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>>,
    admin: { email: string; name: string },
    userReason?: string
  ): Promise<{ success: boolean; asset?: Asset; errors?: string[] }> {
    const localRes = innerKtStore.updateAsset(id, assetData, admin, userReason);

    if (isSupabaseConfigured && supabase && localRes.success && localRes.asset) {
      try {
        await supabase
          .from('assets')
          .update({
            name: localRes.asset.name,
            category: localRes.asset.category,
            owner_id: localRes.asset.ownerId,
            quantity: localRes.asset.quantity,
            capital_per_unit: localRes.asset.capitalPerUnit,
            total_capital: localRes.asset.totalCapital,
            purchase_date: localRes.asset.purchaseDate,
            is_initial_capital: localRes.asset.isInitialCapital,
            notes: localRes.asset.notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
      } catch (err) {
        console.error('Supabase asset update fallback error:', err);
      }
    }

    return localRes;
  },

  async deleteAsset(
    id: string,
    admin: { email: string; name: string }
  ): Promise<{ success: boolean; error?: string }> {
    const localRes = innerKtStore.deleteAsset(id, admin);

    if (isSupabaseConfigured && supabase && localRes.success) {
      try {
        await supabase.from('assets').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase asset delete fallback error:', err);
      }
    }

    return localRes;
  },

  // CRM LEADS
  async getCrmLeads(): Promise<CrmLead[]> {
    if (!isSupabaseConfigured || !supabase) {
      return innerKtStore.getCrmLeads();
    }
    try {
      const { data, error } = await supabase.from('crm_leads').select('*').order('created_at', { ascending: false });
      if (error || !data) return innerKtStore.getCrmLeads();
      return data.map((row) => ({
        id: row.id,
        organizationName: row.organization_name,
        organizationType: row.organization_type,
        eventName: row.event_name,
        eventDate: row.event_date,
        estimatedDuration: row.estimated_duration,
        estimatedUnits: row.estimated_units,
        estimatedBudget: row.estimated_budget ? Number(row.estimated_budget) : null,
        picName: row.pic_name,
        picGender: row.pic_gender,
        picRole: row.pic_role,
        picPhone: row.pic_phone,
        picInstagram: row.pic_instagram,
        pipelineStatus: row.pipeline_status,
        lossReason: row.loss_reason,
        voucherCodeOffered: row.voucher_code_offered,
        nextFollowUpDate: row.next_follow_up_date,
        notes: row.notes,
        convertedOrderId: null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch {
      return innerKtStore.getCrmLeads();
    }
  },

  async addCrmLead(
    leadData: Omit<CrmLead, 'id' | 'createdAt' | 'updatedAt' | 'convertedOrderId'>,
    admin: { email: string; name: string }
  ): Promise<{ success: boolean; lead?: CrmLead; errors?: string[] }> {
    const localRes = innerKtStore.addCrmLead(leadData, admin);

    if (isSupabaseConfigured && supabase && localRes.success && localRes.lead) {
      try {
        await supabase.from('crm_leads').insert({
          organization_name: leadData.organizationName,
          organization_type: leadData.organizationType,
          event_name: leadData.eventName,
          event_date: leadData.eventDate || null,
          estimated_duration: leadData.estimatedDuration,
          estimated_units: leadData.estimatedUnits,
          estimated_budget: leadData.estimatedBudget || 0,
          pic_name: leadData.picName,
          pic_gender: leadData.picGender,
          pic_role: leadData.picRole || null,
          pic_phone: leadData.picPhone || null,
          pic_instagram: leadData.picInstagram || null,
          pipeline_status: leadData.pipelineStatus,
          loss_reason: leadData.lossReason || null,
          voucher_code_offered: leadData.voucherCodeOffered || null,
          next_follow_up_date: leadData.nextFollowUpDate || null,
          notes: leadData.notes || null,
        });
      } catch (err) {
        console.error('Supabase CRM lead insert fallback error:', err);
      }
    }

    return localRes;
  },

  async updateCrmLead(
    id: string,
    updates: Partial<CrmLead>,
    admin: { email: string; name: string }
  ): Promise<{ success: boolean; lead?: CrmLead }> {
    const localRes = innerKtStore.updateCrmLead(id, updates, admin);

    if (isSupabaseConfigured && supabase && localRes.success && localRes.lead) {
      try {
        await supabase
          .from('crm_leads')
          .update({
            organization_name: localRes.lead.organizationName,
            organization_type: localRes.lead.organizationType,
            event_name: localRes.lead.eventName,
            event_date: localRes.lead.eventDate || null,
            estimated_duration: localRes.lead.estimatedDuration,
            estimated_units: localRes.lead.estimatedUnits,
            estimated_budget: localRes.lead.estimatedBudget || 0,
            pic_name: localRes.lead.picName,
            pic_gender: localRes.lead.picGender,
            pic_role: localRes.lead.picRole || null,
            pic_phone: localRes.lead.picPhone || null,
            pic_instagram: localRes.lead.picInstagram || null,
            pipeline_status: localRes.lead.pipelineStatus,
            loss_reason: localRes.lead.lossReason || null,
            voucher_code_offered: localRes.lead.voucherCodeOffered || null,
            next_follow_up_date: localRes.lead.nextFollowUpDate || null,
            notes: localRes.lead.notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
      } catch (err) {
        console.error('Supabase CRM lead update fallback error:', err);
      }
    }

    return localRes;
  },

  async deleteCrmLead(
    id: string,
    admin: { email: string; name: string }
  ): Promise<{ success: boolean; error?: string }> {
    const localRes = innerKtStore.deleteCrmLead(id, admin);

    if (isSupabaseConfigured && supabase && localRes.success) {
      try {
        await supabase.from('crm_leads').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase CRM lead delete fallback error:', err);
      }
    }

    return localRes;
  },

  // AUDIT LOGS
  async getAuditLogs(): Promise<AuditLog[]> {
    if (!isSupabaseConfigured || !supabase) {
      return innerKtStore.getAuditLogs();
    }
    try {
      const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200);
      if (error || !data) return innerKtStore.getAuditLogs();
      return data.map((row) => ({
        id: row.id,
        adminEmail: row.admin_email,
        adminDisplayName: row.admin_display_name,
        entityType: row.entity_type,
        entityId: row.entity_id,
        action: row.action,
        summary: row.summary,
        beforeJson: row.before_json,
        afterJson: row.after_json,
        createdAt: row.created_at,
      }));
    } catch {
      return innerKtStore.getAuditLogs();
    }
  },

  async addAuditLog(entry: Omit<AuditLog, 'id' | 'createdAt'>): Promise<void> {
    innerKtStore.addAuditLog(entry);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('audit_logs').insert({
          admin_email: entry.adminEmail,
          admin_display_name: entry.adminDisplayName,
          entity_type: entry.entityType,
          entity_id: entry.entityId,
          action: entry.action,
          summary: entry.summary,
          before_json: entry.beforeJson || null,
          after_json: entry.afterJson || null,
        });
      } catch (err) {
        console.error('Supabase audit log insert fallback error:', err);
      }
    }
  },

  // FINANCIAL SUMMARY
  getFinancialSummary(filterDateRange?: { startDate?: string; endDate?: string }): BusinessFinancialSummary {
    return innerKtStore.getFinancialSummary(filterDateRange);
  },
};
