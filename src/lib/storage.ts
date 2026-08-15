'use client';

import { get, set, update, del, createStore } from 'idb-keyval';

export interface DeckProgressState {
  deckId: string;
  currentIndex: number;
  totalCards: number;
  percent: number;
  completed: boolean;
  cardIds?: string[];
  lastVisitedAt: number;
}

export interface UserSettings {
  hapticsEnabled: boolean;
  soundEnabled: boolean;
}

export interface AppStorageData {
  deckStates: Record<string, DeckProgressState>;
  lastActiveDeckId: string | null;
  settings: UserSettings;
  version: number;
}

const STORAGE_VERSION = 1;
const IDB_DB_NAME = 'wsomeone_db';
const IDB_STORE_NAME = 'wsomeone_store';
const LS_FALLBACK_KEY = 'wsomeone_data_v1';
const COOKIE_KEY = 'wsomeone_progress_summary';

// Custom IndexedDB store instance for clean namespace
const customStore =
  typeof window !== 'undefined' && 'indexedDB' in window
    ? createStore(IDB_DB_NAME, IDB_STORE_NAME)
    : undefined;

const DEFAULT_SETTINGS: UserSettings = {
  hapticsEnabled: true,
  soundEnabled: true,
};

const DEFAULT_STORAGE_DATA: AppStorageData = {
  deckStates: {},
  lastActiveDeckId: null,
  settings: DEFAULT_SETTINGS,
  version: STORAGE_VERSION,
};

/**
 * Cookie Utilities for fast SSR / initial handshake
 */
function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return;
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch {
    // Ignore cookie write errors
  }
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const nameEq = encodeURIComponent(name) + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1);
      if (c.indexOf(nameEq) === 0) {
        return decodeURIComponent(c.substring(nameEq.length));
      }
    }
  } catch {
    // Ignore cookie read errors
  }
  return null;
}

/**
 * Synchronize lightweight summary into Cookie
 */
function syncCookieSummary(data: AppStorageData) {
  try {
    const summary = {
      activeDeck: data.lastActiveDeckId,
      progress: Object.entries(data.deckStates).reduce<Record<string, number>>(
        (acc, [id, state]) => {
          acc[id] = state.percent;
          return acc;
        },
        {}
      ),
    };
    setCookie(COOKIE_KEY, JSON.stringify(summary));
  } catch {
    // Ignore cookie serialization issues
  }
}

/**
 * Synchronize state to localStorage fallback
 */
function syncLocalStorage(data: AppStorageData) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota / private mode errors
  }
}

/**
 * Read data from localStorage fallback
 */
function readLocalStorage(): AppStorageData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LS_FALLBACK_KEY);
    if (raw) {
      return JSON.parse(raw) as AppStorageData;
    }
  } catch {
    // Ignore localStorage parse errors
  }
  return null;
}

/**
 * Load complete application state from IndexedDB (with fallback)
 */
export async function loadAppStorage(): Promise<AppStorageData> {
  if (typeof window === 'undefined') {
    return DEFAULT_STORAGE_DATA;
  }

  try {
    if (customStore) {
      const idbData = await get<AppStorageData>('app_state', customStore);
      if (idbData && idbData.deckStates) {
        // Sync to localStorage and cookie in background to keep all tiers updated
        syncLocalStorage(idbData);
        syncCookieSummary(idbData);
        return {
          ...DEFAULT_STORAGE_DATA,
          ...idbData,
          settings: { ...DEFAULT_SETTINGS, ...(idbData.settings || {}) },
        };
      }
    }
  } catch (err) {
    console.warn('IndexedDB read failed, falling back to localStorage:', err);
  }

  // Fallback to localStorage
  const lsData = readLocalStorage();
  if (lsData && lsData.deckStates) {
    return {
      ...DEFAULT_STORAGE_DATA,
      ...lsData,
      settings: { ...DEFAULT_SETTINGS, ...(lsData.settings || {}) },
    };
  }

  // Fallback to cookie summary if localStorage is also empty
  const cookieRaw = getCookie(COOKIE_KEY);
  if (cookieRaw) {
    try {
      const cookieSummary = JSON.parse(cookieRaw);
      const reconstructedDeckStates: Record<string, DeckProgressState> = {};
      if (cookieSummary.progress) {
        for (const [deckId, percent] of Object.entries(cookieSummary.progress)) {
          reconstructedDeckStates[deckId] = {
            deckId,
            currentIndex: 0,
            totalCards: 0,
            percent: Number(percent) || 0,
            completed: Number(percent) >= 100,
            lastVisitedAt: Date.now(),
          };
        }
      }
      return {
        ...DEFAULT_STORAGE_DATA,
        deckStates: reconstructedDeckStates,
        lastActiveDeckId: cookieSummary.activeDeck || null,
      };
    } catch {
      // Ignore
    }
  }

  return DEFAULT_STORAGE_DATA;
}

/**
 * Save complete application state to IndexedDB and fallback tiers
 */
export async function saveAppStorage(data: AppStorageData): Promise<void> {
  if (typeof window === 'undefined') return;

  // 1. Sync to LocalStorage & Cookie immediately for fast availability
  syncLocalStorage(data);
  syncCookieSummary(data);

  // 2. Persist to IndexedDB
  try {
    if (customStore) {
      await set('app_state', data, customStore);
    }
  } catch (err) {
    console.warn('IndexedDB write failed:', err);
  }
}

/**
 * Persist or update progress for a specific deck
 */
export async function saveDeckProgress(
  deckId: string,
  currentIndex: number,
  totalCards: number,
  cardIds?: string[]
): Promise<DeckProgressState> {
  const percent =
    totalCards > 0 ? Math.min(100, Math.round((currentIndex / totalCards) * 100)) : 0;
  const completed = percent >= 100;

  const newState: DeckProgressState = {
    deckId,
    currentIndex,
    totalCards,
    percent,
    completed,
    cardIds,
    lastVisitedAt: Date.now(),
  };

  if (typeof window === 'undefined') return newState;

  try {
    if (customStore) {
      await update<AppStorageData>(
        'app_state',
        (prev) => {
          const current = prev || { ...DEFAULT_STORAGE_DATA };
          const updatedData: AppStorageData = {
            ...current,
            lastActiveDeckId: deckId,
            deckStates: {
              ...current.deckStates,
              [deckId]: newState,
            },
          };
          syncLocalStorage(updatedData);
          syncCookieSummary(updatedData);
          return updatedData;
        },
        customStore
      );
      return newState;
    }
  } catch (err) {
    console.warn('IndexedDB update failed, using localStorage fallback:', err);
  }

  // Fallback direct write
  const existing = readLocalStorage() || { ...DEFAULT_STORAGE_DATA };
  const updatedData: AppStorageData = {
    ...existing,
    lastActiveDeckId: deckId,
    deckStates: {
      ...existing.deckStates,
      [deckId]: newState,
    },
  };
  syncLocalStorage(updatedData);
  syncCookieSummary(updatedData);

  return newState;
}

/**
 * Reset progress for a specific deck
 */
export async function resetDeckProgress(deckId: string): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    if (customStore) {
      await update<AppStorageData>(
        'app_state',
        (prev) => {
          const current = prev || { ...DEFAULT_STORAGE_DATA };
          const newDeckStates = { ...current.deckStates };
          delete newDeckStates[deckId];
          const updatedData: AppStorageData = {
            ...current,
            deckStates: newDeckStates,
          };
          syncLocalStorage(updatedData);
          syncCookieSummary(updatedData);
          return updatedData;
        },
        customStore
      );
      return;
    }
  } catch (err) {
    console.warn('IndexedDB reset deck failed:', err);
  }

  const existing = readLocalStorage() || { ...DEFAULT_STORAGE_DATA };
  const newDeckStates = { ...existing.deckStates };
  delete newDeckStates[deckId];
  const updatedData: AppStorageData = {
    ...existing,
    deckStates: newDeckStates,
  };
  syncLocalStorage(updatedData);
  syncCookieSummary(updatedData);
}

/**
 * Clear all stored data
 */
export async function clearAllStorage(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    if (customStore) {
      await del('app_state', customStore);
    }
  } catch (err) {
    console.warn('IndexedDB clear failed:', err);
  }

  try {
    localStorage.removeItem(LS_FALLBACK_KEY);
    setCookie(COOKIE_KEY, '', -1);
  } catch {
    // Ignore
  }
}
