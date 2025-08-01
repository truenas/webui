import { LocalStorageError } from 'app/modules/websocket-debug-panel/interfaces/error.types';

export function safeGetItem<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return defaultValue;
    }

    try {
      return JSON.parse(stored) as T;
    } catch (parseError) {
      const error = new LocalStorageError(
        `Failed to parse data from localStorage key: ${key}`,
        'parse',
        key,
        parseError,
      );
      console.error('LocalStorage parse error:', error);
      return defaultValue;
    }
  } catch (readError) {
    const error = new LocalStorageError(
      `Failed to read from localStorage key: ${key}`,
      'read',
      key,
      readError,
    );
    console.error('LocalStorage read error:', error);
    return defaultValue;
  }
}

export async function safeSetItem<T>(key: string, value: T): Promise<void> {
  return Promise.resolve().then(() => {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (writeError) {
      const error = new LocalStorageError(
        `Failed to save to localStorage key: ${key}`,
        'write',
        key,
        writeError,
      );
      console.error('LocalStorage write error:', error);
      throw error;
    }
  });
}

export async function safeRemoveItem(key: string): Promise<void> {
  return Promise.resolve().then(() => {
    try {
      localStorage.removeItem(key);
    } catch (removeError) {
      const error = new LocalStorageError(
        `Failed to remove from localStorage key: ${key}`,
        'remove',
        key,
        removeError,
      );
      console.error('LocalStorage remove error:', error);
      throw error;
    }
  });
}
