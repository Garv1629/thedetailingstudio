import {
  WRAP_COLOURS,
  type WrapColourId,
} from '../data/atelierData';
import type { ConfirmedBooking } from './bookingLogic';

export const STUDIO_DB_NAME = 'the-detailing-studio-db';
export const STUDIO_DB_VERSION = 1;
export const BOOKINGS_STORE_NAME = 'bookings';
export const PREFERENCES_STORE_NAME = 'preferences';

export const LS_BOOKINGS_KEY = 'tds.v1.bookings';
export const LS_PREFERENCES_KEY = 'tds.v1.preferences';

export interface StudioPreferences {
  selectedWrapId: WrapColourId;
  customWrapHex: string | null;
  updatedAtIso?: string;
}

export interface StorageRuntime {
  indexedDB?: IDBFactory | null;
  localStorage?: Pick<Storage, 'getItem' | 'setItem'> | null;
}

export interface PersistenceHealthStatus {
  backend: 'indexeddb' | 'localstorage' | 'memory';
  lastError: string | null;
}

const VALID_WRAP_IDS = new Set<string>(WRAP_COLOURS.map((w) => w.id));
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

let cachedDbPromise: Promise<IDBDatabase | null> | null = null;
let cachedIdbFactory: IDBFactory | null | undefined = undefined;
let lastHealth: PersistenceHealthStatus = {
  backend: 'memory',
  lastError: null,
};

function getDefaultRuntime(overrides?: StorageRuntime): {
  idb: IDBFactory | null;
  ls: Pick<Storage, 'getItem' | 'setItem'> | null;
} {
  let idb: IDBFactory | null = null;
  if (overrides && 'indexedDB' in overrides) {
    idb = overrides.indexedDB ?? null;
  } else if (typeof globalThis !== 'undefined' && 'indexedDB' in globalThis) {
    try {
      idb = globalThis.indexedDB ?? null;
    } catch {
      idb = null;
    }
  }

  let ls: Pick<Storage, 'getItem' | 'setItem'> | null = null;
  if (overrides && 'localStorage' in overrides) {
    ls = overrides.localStorage ?? null;
  } else if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
    try {
      ls = globalThis.localStorage ?? null;
    } catch {
      ls = null;
    }
  }

  return { idb, ls };
}

export function resetStorageConnectionForTests(): void {
  cachedDbPromise = null;
  cachedIdbFactory = undefined;
  lastHealth = { backend: 'memory', lastError: null };
}

export function getPersistenceHealth(): PersistenceHealthStatus {
  return { ...lastHealth };
}

export function isValidConfirmedBooking(
  candidate: unknown,
): candidate is ConfirmedBooking {
  if (!candidate || typeof candidate !== 'object') return false;
  const record = candidate as Record<string, unknown>;
  if (typeof record.reference !== 'string' || !record.reference.trim()) {
    return false;
  }
  if (typeof record.createdAt !== 'string') return false;

  const values = record.values as Record<string, unknown> | undefined;
  const estimate = record.estimate as Record<string, unknown> | undefined;
  if (!values || typeof values !== 'object') return false;
  if (!estimate || typeof estimate !== 'object') return false;

  return (
    typeof values.fullName === 'string' &&
    typeof values.email === 'string' &&
    typeof values.phone === 'string' &&
    typeof values.vehicle === 'string' &&
    typeof values.preferredDate === 'string' &&
    typeof values.timeSlot === 'string' &&
    typeof estimate.totalPrice === 'number' &&
    Number.isFinite(estimate.totalPrice) &&
    typeof estimate.estimatedDaysLabel === 'string'
  );
}

export function sanitizeStudioPreferences(
  candidate: unknown,
): StudioPreferences | null {
  if (!candidate || typeof candidate !== 'object') return null;
  const record = candidate as Record<string, unknown>;
  if (
    typeof record.selectedWrapId !== 'string' ||
    !VALID_WRAP_IDS.has(record.selectedWrapId)
  ) {
    return null;
  }

  const rawCustom = record.customWrapHex;
  const customWrapHex =
    typeof rawCustom === 'string' && HEX_COLOR_PATTERN.test(rawCustom)
      ? rawCustom.toUpperCase()
      : null;

  return {
    selectedWrapId: record.selectedWrapId as WrapColourId,
    customWrapHex,
    updatedAtIso:
      typeof record.updatedAtIso === 'string' ? record.updatedAtIso : undefined,
  };
}

export function mergeBookingsNonDestructively(
  primary: ConfirmedBooking[],
  secondary: ConfirmedBooking[],
): ConfirmedBooking[] {
  const byRef = new Map<string, ConfirmedBooking>();
  for (const item of [...secondary, ...primary]) {
    if (isValidConfirmedBooking(item)) {
      byRef.set(item.reference, item);
    }
  }
  return Array.from(byRef.values()).sort((a, b) => {
    const timeA = a.createdAtIso ? Date.parse(a.createdAtIso) : 0;
    const timeB = b.createdAtIso ? Date.parse(b.createdAtIso) : 0;
    if (timeB !== timeA) return timeB - timeA;
    return b.reference.localeCompare(a.reference);
  });
}

function readLocalBookings(
  ls: Pick<Storage, 'getItem' | 'setItem'> | null,
): ConfirmedBooking[] {
  if (!ls) return [];
  try {
    const raw = ls.getItem(LS_BOOKINGS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidConfirmedBooking);
  } catch {
    // Corrupted JSON is never overwritten with empty data; return safe subset
    return [];
  }
}

function writeLocalBookings(
  ls: Pick<Storage, 'getItem' | 'setItem'> | null,
  booking: ConfirmedBooking,
): boolean {
  if (!ls) return false;
  try {
    const existing = readLocalBookings(ls);
    const merged = mergeBookingsNonDestructively([booking], existing);
    ls.setItem(LS_BOOKINGS_KEY, JSON.stringify(merged));
    return true;
  } catch (err) {
    lastHealth = {
      backend: lastHealth.backend,
      lastError: err instanceof Error ? err.message : 'localStorage write failed',
    };
    return false;
  }
}

function readLocalPreferences(
  ls: Pick<Storage, 'getItem' | 'setItem'> | null,
): StudioPreferences | null {
  if (!ls) return null;
  try {
    const raw = ls.getItem(LS_PREFERENCES_KEY);
    if (!raw) return null;
    return sanitizeStudioPreferences(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeLocalPreferences(
  ls: Pick<Storage, 'getItem' | 'setItem'> | null,
  prefs: StudioPreferences,
): boolean {
  if (!ls) return false;
  try {
    ls.setItem(LS_PREFERENCES_KEY, JSON.stringify(prefs));
    return true;
  } catch {
    return false;
  }
}

/**
 * Opens (or reuses) the singleton IndexedDB connection safely.
 * Non-destructive: only creates missing stores during onupgradeneeded,
 * never deletes or clears existing user data on error.
 */
export function openStudioDatabase(
  runtime?: StorageRuntime,
): Promise<IDBDatabase | null> {
  const { idb } = getDefaultRuntime(runtime);
  if (!idb || typeof idb.open !== 'function') {
    lastHealth = { backend: 'localstorage', lastError: 'IndexedDB unavailable' };
    return Promise.resolve(null);
  }

  if (cachedDbPromise && cachedIdbFactory === idb) {
    return cachedDbPromise;
  }

  cachedIdbFactory = idb;
  cachedDbPromise = new Promise<IDBDatabase | null>((resolve) => {
    try {
      const request = idb.open(STUDIO_DB_NAME, STUDIO_DB_VERSION);

      request.onupgradeneeded = () => {
        try {
          const db = request.result;
          if (!db.objectStoreNames.contains(BOOKINGS_STORE_NAME)) {
            const store = db.createObjectStore(BOOKINGS_STORE_NAME, {
              keyPath: 'reference',
            });
            if (!store.indexNames.contains('createdAtIso')) {
              store.createIndex('createdAtIso', 'createdAtIso', {
                unique: false,
              });
            }
          }
          if (!db.objectStoreNames.contains(PREFERENCES_STORE_NAME)) {
            db.createObjectStore(PREFERENCES_STORE_NAME, { keyPath: 'key' });
          }
        } catch (upgradeErr) {
          lastHealth = {
            backend: 'localstorage',
            lastError:
              upgradeErr instanceof Error
                ? upgradeErr.message
                : 'Database upgrade error',
          };
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          try {
            db.close();
          } catch {
            // Ignore close errors
          }
          if (cachedIdbFactory === idb) {
            cachedDbPromise = null;
          }
        };
        db.onclose = () => {
          if (cachedIdbFactory === idb) {
            cachedDbPromise = null;
          }
        };
        lastHealth = { backend: 'indexeddb', lastError: null };
        resolve(db);
      };

      request.onerror = () => {
        cachedDbPromise = null;
        lastHealth = {
          backend: 'localstorage',
          lastError: request.error?.message ?? 'IndexedDB open failed',
        };
        resolve(null);
      };

      request.onblocked = () => {
        lastHealth = {
          backend: 'localstorage',
          lastError: 'IndexedDB open blocked by another tab',
        };
        resolve(null);
      };
    } catch (err) {
      cachedDbPromise = null;
      lastHealth = {
        backend: 'localstorage',
        lastError: err instanceof Error ? err.message : 'IndexedDB open threw',
      };
      resolve(null);
    }
  });

  return cachedDbPromise;
}

function readAllFromStore<T>(
  db: IDBDatabase,
  storeName: string,
): Promise<T[] | null> {
  return new Promise((resolve) => {
    try {
      if (!db.objectStoreNames.contains(storeName)) {
        resolve(null);
        return;
      }
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => {
        resolve(Array.isArray(req.result) ? (req.result as T[]) : []);
      };
      req.onerror = () => resolve(null);
      tx.onabort = () => resolve(null);
      tx.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function readKeyFromStore<T>(
  db: IDBDatabase,
  storeName: string,
  key: IDBValidKey,
): Promise<T | null> {
  return new Promise((resolve) => {
    try {
      if (!db.objectStoreNames.contains(storeName)) {
        resolve(null);
        return;
      }
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T | undefined) ?? null);
      req.onerror = () => resolve(null);
      tx.onabort = () => resolve(null);
      tx.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function putRecordInStore(
  db: IDBDatabase,
  storeName: string,
  value: unknown,
): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      if (!db.objectStoreNames.contains(storeName)) {
        resolve(false);
        return;
      }
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.put(value);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => {
        lastHealth = {
          backend: 'localstorage',
          lastError: tx.error?.message ?? 'IndexedDB write error',
        };
        resolve(false);
      };
      tx.onabort = () => {
        lastHealth = {
          backend: 'localstorage',
          lastError: tx.error?.message ?? 'IndexedDB transaction aborted',
        };
        resolve(false);
      };
    } catch (err) {
      lastHealth = {
        backend: 'localstorage',
        lastError:
          err instanceof Error ? err.message : 'IndexedDB write threw',
      };
      resolve(false);
    }
  });
}

/**
 * Loads all confirmed studio inspection bookings from IndexedDB, merged
 * non-destructively with any localStorage mirror records.
 */
export async function loadStudioBookings(
  runtime?: StorageRuntime,
): Promise<ConfirmedBooking[]> {
  const { ls } = getDefaultRuntime(runtime);
  const localRecords = readLocalBookings(ls);

  const db = await openStudioDatabase(runtime);
  if (!db) {
    return mergeBookingsNonDestructively(localRecords, []);
  }

  const idbRaw = await readAllFromStore<unknown>(db, BOOKINGS_STORE_NAME);
  if (idbRaw === null) {
    return mergeBookingsNonDestructively(localRecords, []);
  }

  const idbValid = idbRaw.filter(isValidConfirmedBooking);
  return mergeBookingsNonDestructively(idbValid, localRecords);
}

/**
 * Persists a newly confirmed booking non-destructively into IndexedDB
 * (and mirrors to localStorage as a resilient fallback). Never clears
 * or overwrites existing unrelated bookings.
 */
export async function saveStudioBooking(
  booking: ConfirmedBooking,
  runtime?: StorageRuntime,
): Promise<{ persisted: boolean; backend: PersistenceHealthStatus['backend'] }> {
  if (!isValidConfirmedBooking(booking)) {
    return { persisted: false, backend: 'memory' };
  }

  const normalized: ConfirmedBooking = {
    ...booking,
    createdAtIso: booking.createdAtIso ?? new Date().toISOString(),
  };

  const { ls } = getDefaultRuntime(runtime);
  const lsSaved = writeLocalBookings(ls, normalized);

  const db = await openStudioDatabase(runtime);
  if (db) {
    const idbSaved = await putRecordInStore(db, BOOKINGS_STORE_NAME, normalized);
    if (idbSaved) {
      lastHealth = { backend: 'indexeddb', lastError: null };
      return { persisted: true, backend: 'indexeddb' };
    }
  }

  return {
    persisted: lsSaved,
    backend: lsSaved ? 'localstorage' : 'memory',
  };
}

/**
 * Loads saved bespoke wrap colour preferences non-destructively.
 */
export async function loadStudioPreferences(
  runtime?: StorageRuntime,
): Promise<StudioPreferences | null> {
  const { ls } = getDefaultRuntime(runtime);
  const localPrefs = readLocalPreferences(ls);

  const db = await openStudioDatabase(runtime);
  if (!db) return localPrefs;

  const raw = await readKeyFromStore<Record<string, unknown>>(
    db,
    PREFERENCES_STORE_NAME,
    'wrap-selection',
  );
  const idbPrefs = sanitizeStudioPreferences(raw);
  return idbPrefs ?? localPrefs;
}

/**
 * Persists user wrap preferences non-destructively in IndexedDB with
 * localStorage mirror fallback.
 */
export async function saveStudioPreferences(
  prefs: StudioPreferences,
  runtime?: StorageRuntime,
): Promise<{ persisted: boolean; backend: PersistenceHealthStatus['backend'] }> {
  const clean = sanitizeStudioPreferences({
    ...prefs,
    updatedAtIso: prefs.updatedAtIso ?? new Date().toISOString(),
  });
  if (!clean) {
    return { persisted: false, backend: 'memory' };
  }

  const { ls } = getDefaultRuntime(runtime);
  const lsSaved = writeLocalPreferences(ls, clean);

  const db = await openStudioDatabase(runtime);
  if (db) {
    const idbSaved = await putRecordInStore(db, PREFERENCES_STORE_NAME, {
      key: 'wrap-selection',
      ...clean,
    });
    if (idbSaved) {
      return { persisted: true, backend: 'indexeddb' };
    }
  }

  return {
    persisted: lsSaved,
    backend: lsSaved ? 'localstorage' : 'memory',
  };
}
