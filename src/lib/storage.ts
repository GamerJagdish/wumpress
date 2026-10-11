import { HistoryItem } from './types';

const DB_NAME = 'wumpress_db';
const DB_VERSION = 1;
const STORE_NAME = 'history';

function isIndexedDBAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.indexedDB !== 'undefined' &&
    window.indexedDB !== null
  );
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
}

export async function getAllHistory(): Promise<HistoryItem[]> {
  if (!isIndexedDBAvailable()) return [];

  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = (request.result as HistoryItem[]) || [];
        // Sort descending by timestamp (newest first)
        results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        resolve(results);
      };

      request.onerror = () => {
        console.warn('Failed to read history from IndexedDB:', request.error);
        resolve([]);
      };
    });
  } catch (err) {
    console.warn('Error reading history from IndexedDB:', err);
    return [];
  }
}

export async function saveHistory(
  item: Omit<HistoryItem, 'id' | 'timestamp'> & { id?: string; timestamp?: number }
): Promise<HistoryItem> {
  const finalItem: HistoryItem = {
    ...item,
    id: item.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`),
    timestamp: item.timestamp || Date.now(),
  };

  if (!isIndexedDBAvailable()) {
    return finalItem;
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(finalItem);

      request.onsuccess = () => {
        resolve(finalItem);
      };

      request.onerror = () => {
        console.warn('Failed to save item to IndexedDB:', request.error);
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('Error saving to IndexedDB:', err);
    return finalItem;
  }
}

export async function deleteHistory(id: string): Promise<void> {
  if (!isIndexedDBAvailable()) return;

  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.warn('Failed to delete item from IndexedDB:', request.error);
        resolve();
      };
    });
  } catch (err) {
    console.warn('Error deleting from IndexedDB:', err);
  }
}

export async function clearAllHistory(): Promise<void> {
  if (!isIndexedDBAvailable()) return;

  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.warn('Failed to clear history from IndexedDB:', request.error);
        resolve();
      };
    });
  } catch (err) {
    console.warn('Error clearing IndexedDB:', err);
  }
}
