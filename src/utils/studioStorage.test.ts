import test from 'node:test';
import assert from 'node:assert/strict';
import type { ConfirmedBooking } from './bookingLogic';
import {
  BOOKINGS_STORE_NAME,
  LS_BOOKINGS_KEY,
  LS_PREFERENCES_KEY,
  PREFERENCES_STORE_NAME,
  loadStudioBookings,
  loadStudioPreferences,
  mergeBookingsNonDestructively,
  openStudioDatabase,
  resetStorageConnectionForTests,
  saveStudioBooking,
  saveStudioPreferences,
} from './studioStorage';

function makeBooking(
  reference: string,
  vehicle: string,
  createdAtIso: string,
): ConfirmedBooking {
  return {
    reference,
    createdAt: '11:00 AM',
    createdAtIso,
    values: {
      fullName: 'Aarav Sharma',
      email: 'aarav@example.in',
      phone: '08191811100',
      vehicle,
      mainServiceId: 'ppf-protection',
      subService: 'Full Body PPF',
      packageId: 'signature',
      preferredDate: '2026-12-01',
      timeSlot: '11:00 AM',
      includeColourWrap: false,
      wrapColourId: 'racing-green',
      includeInteriorDetail: false,
      includePickupDrop: false,
      notes: '',
    },
    estimate: {
      basePrice: 65000,
      wrapAddon: 0,
      interiorAddon: 0,
      totalPrice: 65000,
      estimatedDaysLabel: '4–5 days',
    },
  };
}

class MemoryLocalStorage implements Pick<Storage, 'getItem' | 'setItem'> {
  private map = new Map<string, string>();
  public throwOnSet: Error | null = null;

  getItem(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) ?? null) : null;
  }

  setItem(key: string, value: string): void {
    if (this.throwOnSet) throw this.throwOnSet;
    this.map.set(key, value);
  }
}

/**
 * Minimal in-memory IDBFactory mock supporting non-destructive upgrades,
 * concurrent open calls, quota failures, missing stores, and transaction aborts.
 */
function createMockIdb(options?: {
  failOpen?: boolean;
  failWriteError?: Error;
  failRead?: boolean;
  missingStores?: boolean;
  initialRecords?: Record<string, Map<string, unknown>>;
}) {
  const stores =
    options?.initialRecords ??
    ({
      [BOOKINGS_STORE_NAME]: new Map<string, unknown>(),
      [PREFERENCES_STORE_NAME]: new Map<string, unknown>(),
    } as Record<string, Map<string, unknown>>);

  let openCalls = 0;

  const factory = {
    open(_name: string, _version?: number) {
      openCalls += 1;
      const req: Record<string, unknown> = {
        result: null,
        error: null,
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null,
        onblocked: null,
      };

      const db = {
        objectStoreNames: {
          contains: (s: string) =>
            options?.missingStores ? false : s in stores,
        },
        createObjectStore: (s: string) => {
          if (!(s in stores)) {
            stores[s] = new Map<string, unknown>();
          }
          return {
            indexNames: { contains: () => false },
            createIndex: () => ({}),
          };
        },
        close: () => {},
        onversionchange: null,
        onclose: null,
        transaction: (storeName: string, mode: 'readonly' | 'readwrite') => {
          const tx: Record<string, unknown> = {
            error: null,
            oncomplete: null,
            onerror: null,
            onabort: null,
            objectStore: (name: string) => {
              const bucket = stores[name];
              return {
                getAll: () => {
                  const getReq: Record<string, unknown> = {
                    result: null,
                    onsuccess: null,
                    onerror: null,
                  };
                  queueMicrotask(() => {
                    if (options?.failRead) {
                      (getReq.onerror as (() => void) | null)?.();
                    } else {
                      getReq.result = bucket ? Array.from(bucket.values()) : [];
                      (getReq.onsuccess as (() => void) | null)?.();
                    }
                  });
                  return getReq;
                },
                get: (key: string) => {
                  const getReq: Record<string, unknown> = {
                    result: null,
                    onsuccess: null,
                    onerror: null,
                  };
                  queueMicrotask(() => {
                    if (options?.failRead) {
                      (getReq.onerror as (() => void) | null)?.();
                    } else {
                      getReq.result = bucket?.get(key);
                      (getReq.onsuccess as (() => void) | null)?.();
                    }
                  });
                  return getReq;
                },
                put: (value: Record<string, unknown>) => {
                  if (mode !== 'readwrite') throw new Error('Readonly tx');
                  queueMicrotask(() => {
                    if (options?.failWriteError) {
                      tx.error = options.failWriteError;
                      (tx.onabort as (() => void) | null)?.();
                      return;
                    }
                    const key = String(value.reference ?? value.key ?? '');
                    bucket?.set(key, value);
                    (tx.oncomplete as (() => void) | null)?.();
                  });
                },
              };
            },
          };
          void storeName;
          return tx;
        },
      };

      queueMicrotask(() => {
        if (options?.failOpen) {
          req.error = new Error('IDB open blocked');
          (req.onerror as (() => void) | null)?.();
          return;
        }
        req.result = db;
        (req.onupgradeneeded as (() => void) | null)?.();
        (req.onsuccess as (() => void) | null)?.();
      });

      return req as unknown as IDBOpenDBRequest;
    },
  } as unknown as IDBFactory;

  return {
    factory,
    stores,
    getOpenCalls: () => openCalls,
  };
}

test('IndexedDB persists bookings and wrap preferences non-destructively across reloads', async () => {
  resetStorageConnectionForTests();
  const mockIdb = createMockIdb();
  const ls = new MemoryLocalStorage();
  const runtime = { indexedDB: mockIdb.factory, localStorage: ls };

  const b1 = makeBooking('TDS-1201-4101', '2025 Porsche 911', '2026-11-27T10:00:00.000Z');
  const b2 = makeBooking('TDS-1202-5202', '2024 BMW M340i', '2026-11-27T11:00:00.000Z');

  const res1 = await saveStudioBooking(b1, runtime);
  const res2 = await saveStudioBooking(b2, runtime);
  assert.equal(res1.persisted, true);
  assert.equal(res1.backend, 'indexeddb');
  assert.equal(res2.persisted, true);

  await saveStudioPreferences(
    { selectedWrapId: 'papaya', customWrapHex: '#C84B1A' },
    runtime,
  );

  // Simulate full browser restart (reset in-memory connection cache, keep persisted stores)
  resetStorageConnectionForTests();
  const loadedBookings = await loadStudioBookings(runtime);
  const loadedPrefs = await loadStudioPreferences(runtime);

  assert.equal(loadedBookings.length, 2);
  assert.equal(loadedBookings[0].reference, 'TDS-1202-5202');
  assert.equal(loadedBookings[1].reference, 'TDS-1201-4101');
  assert.equal(loadedPrefs?.selectedWrapId, 'papaya');
  assert.equal(loadedPrefs?.customWrapHex, '#C84B1A');
});

test('concurrent openStudioDatabase calls reuse a single initialization promise', async () => {
  resetStorageConnectionForTests();
  const mockIdb = createMockIdb();
  const runtime = { indexedDB: mockIdb.factory, localStorage: new MemoryLocalStorage() };

  const [db1, db2, db3] = await Promise.all([
    openStudioDatabase(runtime),
    openStudioDatabase(runtime),
    openStudioDatabase(runtime),
  ]);

  assert.ok(db1 && db1 === db2 && db2 === db3);
  assert.equal(mockIdb.getOpenCalls(), 1);
});

test('gracefully falls back to localStorage when IndexedDB is unavailable or fails to open', async () => {
  resetStorageConnectionForTests();
  const ls = new MemoryLocalStorage();
  const unavailableRuntime = { indexedDB: null, localStorage: ls };

  const b1 = makeBooking('TDS-1203-1111', 'Mercedes AMG GT', '2026-11-27T12:00:00.000Z');
  const saved = await saveStudioBooking(b1, unavailableRuntime);
  assert.equal(saved.persisted, true);
  assert.equal(saved.backend, 'localstorage');

  // Even if IndexedDB throws/fails to open later, previously saved data remains intact
  resetStorageConnectionForTests();
  const failingIdb = createMockIdb({ failOpen: true });
  const loaded = await loadStudioBookings({
    indexedDB: failingIdb.factory,
    localStorage: ls,
  });
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].reference, 'TDS-1203-1111');
});

test('handles QuotaExceededError, transaction abort, missing stores, and corrupted records without wiping data', async () => {
  resetStorageConnectionForTests();
  const ls = new MemoryLocalStorage();
  const validBooking = makeBooking('TDS-1204-2222', 'Audi RS5', '2026-11-27T09:00:00.000Z');

  // Seed corrupted + valid records in localStorage and valid record in IDB
  ls.setItem(
    LS_BOOKINGS_KEY,
    JSON.stringify([validBooking, { broken: true }, null, 'corrupt']),
  );
  ls.setItem(LS_PREFERENCES_KEY, '{not-valid-json');

  const quotaErr = new Error('QuotaExceededError');
  quotaErr.name = 'QuotaExceededError';
  const quotaIdb = createMockIdb({
    failWriteError: quotaErr,
    initialRecords: {
      [BOOKINGS_STORE_NAME]: new Map<string, unknown>([
        [validBooking.reference, validBooking],
        ['corrupt-row', { reference: '', bad: true }],
      ]),
      [PREFERENCES_STORE_NAME]: new Map(),
    },
  });

  // Reading ignores corrupted entries while preserving valid bookings
  const loaded = await loadStudioBookings({
    indexedDB: quotaIdb.factory,
    localStorage: ls,
  });
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].reference, 'TDS-1204-2222');

  // Corrupted preferences JSON returns null safely without throwing
  const prefs = await loadStudioPreferences({
    indexedDB: quotaIdb.factory,
    localStorage: ls,
  });
  assert.equal(prefs, null);

  // Write hitting QuotaExceededError on IDB still preserves via localStorage fallback
  const b2 = makeBooking('TDS-1205-3333', 'Porsche Taycan', '2026-11-27T13:00:00.000Z');
  const writeResult = await saveStudioBooking(b2, {
    indexedDB: quotaIdb.factory,
    localStorage: ls,
  });
  assert.equal(writeResult.persisted, true);
  assert.equal(writeResult.backend, 'localstorage');

  // Both bookings survive when read back with missing stores or read failures
  resetStorageConnectionForTests();
  const missingStoreIdb = createMockIdb({ missingStores: true });
  const afterMissingStore = await loadStudioBookings({
    indexedDB: missingStoreIdb.factory,
    localStorage: ls,
  });
  assert.equal(afterMissingStore.length, 2);

  resetStorageConnectionForTests();
  const failReadIdb = createMockIdb({ failRead: true });
  const afterFailRead = await loadStudioBookings({
    indexedDB: failReadIdb.factory,
    localStorage: ls,
  });
  assert.equal(afterFailRead.length, 2);

  // Even if BOTH IDB and localStorage throw QuotaExceededError, never throws unhandled exception
  ls.throwOnSet = quotaErr;
  const bothFull = await saveStudioBooking(
    makeBooking('TDS-1206-4444', 'Ferrari Roma', '2026-11-27T14:00:00.000Z'),
    { indexedDB: quotaIdb.factory, localStorage: ls },
  );
  assert.equal(bothFull.persisted, false);
  assert.equal(bothFull.backend, 'memory');
});

test('mergeBookingsNonDestructively deduplicates by reference and preserves chronological order', () => {
  const older = makeBooking('TDS-1201-1001', 'Car A', '2026-11-26T10:00:00.000Z');
  const newer = makeBooking('TDS-1202-1002', 'Car B', '2026-11-27T10:00:00.000Z');
  const merged = mergeBookingsNonDestructively([older, newer], [older]);
  assert.equal(merged.length, 2);
  assert.equal(merged[0].reference, 'TDS-1202-1002');
  assert.equal(merged[1].reference, 'TDS-1201-1001');
});
