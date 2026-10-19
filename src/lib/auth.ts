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

/**
 * Authenticates with email and password against the 3 pre-seeded admin accounts.
 */
export function login(email: string, passwordPlain: string): { success: boolean; session?: AuthSession; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = passwordPlain.trim();

  const foundAdmin = INITIAL_ADMINS.find(
    (a) => a.email.toLowerCase() === cleanEmail && a.passwordPlain === cleanPass
  );

  if (!foundAdmin) {
    return {
      success: false,
      error: 'Email atau password salah. Pastikan menggunakan akun admin Kanal Tiga yang valid.',
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
    // Also set a document cookie so client or edge middleware knows session state
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
