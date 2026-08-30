import type { BlogArticle } from '../types';

const DB_NAME = 'class12_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'media_blobs';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

export const saveMediaBlob = async (id: string, blob: Blob | string): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(blob, id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Failed to save media blob to IndexedDB:', e);
  }
};

export const getMediaBlob = async (id: string): Promise<Blob | string | null> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Failed to get media blob from IndexedDB:', e);
    return null;
  }
};

export const deleteMediaBlob = async (id: string): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Failed to delete media blob from IndexedDB:', e);
  }
};

/**
 * Safely persists articles array to localStorage without throwing QuotaExceededError.
 */
export const safeSaveArticlesToLocalStorage = (key: string, articles: BlogArticle[]): void => {
  try {
    // Clone and sanitize mediaAssets so long base64 strings don't blow up localStorage
    const sanitizedArticles = articles.map((art) => ({
      ...art,
      mediaAssets: art.mediaAssets.map((asset) => {
        // If url is a huge base64 data string (> 50KB), we save it to IndexedDB and truncate in localStorage
        if (asset.url && asset.url.length > 50000 && asset.url.startsWith('data:')) {
          saveMediaBlob(asset.id, asset.url);
          return {
            ...asset,
            url: `indexeddb://${asset.id}`,
          };
        }
        return asset;
      }),
    }));

    localStorage.setItem(key, JSON.stringify(sanitizedArticles));
  } catch (e) {
    console.warn('localStorage.setItem quota exceeded or failed. Content remains in memory.', e);
  }
};
