// ============================================================================
// inner-kt — Admin Authentication & Session Management
// Strict 3-Admin Setup for Surya (Owner 1), Pemilik B (Owner 2), Pemilik C (Owner 3)
// ============================================================================

import { AdminUser, Owner } from '@/types';
import { INITIAL_ADMINS, INITIAL_OWNERS } from './seed-data';

const SESSION_STORAGE_KEY = 'inner_kt_session_user';

export interface AuthSession {
  admin: AdminUser;
  owner?: Owner;
  token: string;
}

/**
 * Returns current authenticated session from browser storage (or null if not logged in).
 */
export function getCurrentSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Authenticates with email and password against Supabase admin_users (or local seed fallback).
 */
export async function loginAsync(
  email: string,
  passwordPlain: string
): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = passwordPlain.trim();

  // 1. Direct Supabase authentication against admin_users table
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', cleanEmail)
        .eq('password_plain', cleanPass)
        .single();

      if (!error && data) {
        let linkedOwner = INITIAL_OWNERS.find((o) => o.id === data.owner_id);
        if (!linkedOwner) {
          const { data: ownerData } = await supabase
            .from('owners')
            .select('*')
            .eq('id', data.owner_id)
            .single();

          if (ownerData) {
            linkedOwner = {
              id: ownerData.id,
              code: ownerData.code,
              name: ownerData.name,
              colorBadge: ownerData.color_badge,
              isActive: ownerData.is_active,
              joinedAt: ownerData.joined_at,
              notes: ownerData.notes,
            };
          }
        }

        const session: AuthSession = {
          admin: {
            id: data.id,
            username: data.username,
            email: data.email,
            passwordPlain: data.password_plain,
            displayName: data.display_name,
            ownerId: data.owner_id,
            role: data.role,
            createdAt: data.created_at,
          },
          owner: linkedOwner,
          token: `session_${data.username}_${Date.now()}`,
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
          document.cookie = `inner_kt_logged_in=true; path=/; max-age=86400; SameSite=Lax`;
          document.cookie = `inner_kt_admin=${data.username}; path=/; max-age=86400; SameSite=Lax`;
        }

        return { success: true, session };
      }
    } catch (e) {
      console.warn('Supabase auth fallback:', e);
    }
  }

  // 2. Local fallback
  return login(email, passwordPlain);
}

/**
 * Synchronous local authentication fallback against INITIAL_ADMINS.
 */
export function login(
  email: string,
  passwordPlain: string
): { success: boolean; session?: AuthSession; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = passwordPlain.trim();

  const foundAdmin = INITIAL_ADMINS.find(
    (a) => a.email.toLowerCase() === cleanEmail && a.passwordPlain === cleanPass
  );

  if (!foundAdmin) {
    return {
      success: false,
      error: 'Email atau password yang Anda masukkan tidak sesuai.',
    };
  }

  const linkedOwner = INITIAL_OWNERS.find((o) => o.id === foundAdmin.ownerId);

  const session: AuthSession = {
    admin: foundAdmin,
    owner: linkedOwner,
    token: `session_${foundAdmin.username}_${Date.now()}`,
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    document.cookie = `inner_kt_logged_in=true; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `inner_kt_admin=${foundAdmin.username}; path=/; max-age=86400; SameSite=Lax`;
  }

  return { success: true, session };
}

/**
 * Quick dev / internal login helper to log in directly as one of the 3 admin accounts.
 */
export function quickLoginAs(adminUsername: 'admin1' | 'admin2' | 'admin3'): AuthSession {
  const foundAdmin = INITIAL_ADMINS.find((a) => a.username === adminUsername);
  if (!foundAdmin) {
    throw new Error(`Admin ${adminUsername} tidak ditemukan.`);
  }

  const linkedOwner = INITIAL_OWNERS.find((o) => o.id === foundAdmin.ownerId);

  const session: AuthSession = {
    admin: foundAdmin,
    owner: linkedOwner,
    token: `session_${foundAdmin.username}_${Date.now()}`,
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    document.cookie = `inner_kt_logged_in=true; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `inner_kt_admin=${foundAdmin.username}; path=/; max-age=86400; SameSite=Lax`;
  }

  return session;
}

/**
 * Logs out current admin and removes session keys
 */
export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    document.cookie = 'inner_kt_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'inner_kt_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
}
