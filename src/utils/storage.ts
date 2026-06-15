import { del, get, set } from 'idb-keyval';
import { STORAGE_MESSAGES } from '@/constants/messages';

const STORAGE_VERSION = 1;

export const STORAGE_KEYS = {
  users: 'roomflow:v1:users',
  rooms: 'roomflow:v1:rooms',
  bookings: 'roomflow:v1:bookings',
  authUserId: 'roomflow:v1:auth-user-id',
  theme: 'roomflow:v1:theme',
  conflictCache: 'roomflow:v1:conflict-cache',
  seedVersion: 'roomflow:v1:seed-version',
} as const;

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

interface Envelope<T> {
  version: number;
  savedAt: string;
  payload: T;
}

const inMemoryFallback = new Map<string, unknown>();

function buildEnvelope<T>(payload: T): Envelope<T> {
  return {
    version: STORAGE_VERSION,
    savedAt: new Date().toISOString(),
    payload,
  };
}

function unwrapEnvelope<T>(value: unknown, fallback: T): T {
  if (!value || typeof value !== 'object') {
    return fallback;
  }

  const envelope = value as Partial<Envelope<T>>;
  if (envelope.version !== STORAGE_VERSION || !('payload' in envelope)) {
    return fallback;
  }
  return envelope.payload as T;
}

export async function readCollection<T>(key: StorageKey, fallback: T): Promise<T> {
  try {
    const localValue = localStorage.getItem(key);
    if (localValue) {
      return unwrapEnvelope<T>(JSON.parse(localValue), fallback);
    }

    const indexedValue = await get<Envelope<T>>(key);
    return unwrapEnvelope<T>(indexedValue, fallback);
  } catch (error) {
    console.warn(STORAGE_MESSAGES.readFailed, key, error);
    return (inMemoryFallback.get(key) as T) ?? fallback;
  }
}

export async function writeCollection<T>(key: StorageKey, payload: T): Promise<T> {
  const envelope = buildEnvelope(payload);

  try {
    localStorage.setItem(key, JSON.stringify(envelope));
    await set(key, envelope);
  } catch (error) {
    console.warn(STORAGE_MESSAGES.writeFailed, key, error);
    inMemoryFallback.set(key, payload);
  }

  return payload;
}

export async function removeCollection(key: StorageKey): Promise<void> {
  localStorage.removeItem(key);
  await del(key);
  inMemoryFallback.delete(key);
}

export async function setConflictCache<T>(payload: T): Promise<T> {
  return writeCollection(STORAGE_KEYS.conflictCache, payload);
}

export async function getConflictCache<T>(fallback: T): Promise<T> {
  return readCollection(STORAGE_KEYS.conflictCache, fallback);
}

export async function markSeeded(): Promise<void> {
  await writeCollection(STORAGE_KEYS.seedVersion, STORAGE_VERSION);
}

export async function isSeeded(): Promise<boolean> {
  const current = await readCollection(STORAGE_KEYS.seedVersion, 0);
  return current === STORAGE_VERSION;
}
