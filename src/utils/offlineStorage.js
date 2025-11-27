// IndexedDB wrapper for offline data storage
class OfflineStorage {
  constructor() {
    this.dbName = 'CiproOfflineDB';
    this.version = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // User data store
        if (!db.objectStoreNames.contains('userData')) {
          db.createObjectStore('userData', { keyPath: 'userId' });
        }

        // Game progress store
        if (!db.objectStoreNames.contains('gameProgress')) {
          const gameStore = db.createObjectStore('gameProgress', { keyPath: 'id', autoIncrement: true });
          gameStore.createIndex('userId', 'userId', { unique: false });
          gameStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Pending actions store (for sync when online)
        if (!db.objectStoreNames.contains('pendingActions')) {
          const actionStore = db.createObjectStore('pendingActions', { keyPath: 'id', autoIncrement: true });
          actionStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Cached data store
        if (!db.objectStoreNames.contains('cachedData')) {
          const cacheStore = db.createObjectStore('cachedData', { keyPath: 'key' });
          cacheStore.createIndex('expiry', 'expiry', { unique: false });
        }
      };
    });
  }

  async saveUserData(userData) {
    const transaction = this.db.transaction(['userData'], 'readwrite');
    const store = transaction.objectStore('userData');
    return store.put(userData);
  }

  async getUserData(userId) {
    const transaction = this.db.transaction(['userData'], 'readonly');
    const store = transaction.objectStore('userData');
    return new Promise((resolve, reject) => {
      const request = store.get(userId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveGameProgress(gameData) {
    const transaction = this.db.transaction(['gameProgress'], 'readwrite');
    const store = transaction.objectStore('gameProgress');
    return store.add({
      ...gameData,
      timestamp: Date.now(),
      synced: false
    });
  }

  async getGameProgress(userId) {
    const transaction = this.db.transaction(['gameProgress'], 'readonly');
    const store = transaction.objectStore('gameProgress');
    const index = store.index('userId');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(userId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async addPendingAction(action) {
    const transaction = this.db.transaction(['pendingActions'], 'readwrite');
    const store = transaction.objectStore('pendingActions');
    return store.add({
      ...action,
      timestamp: Date.now()
    });
  }

  async getPendingActions() {
    const transaction = this.db.transaction(['pendingActions'], 'readonly');
    const store = transaction.objectStore('pendingActions');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removePendingAction(id) {
    const transaction = this.db.transaction(['pendingActions'], 'readwrite');
    const store = transaction.objectStore('pendingActions');
    return store.delete(id);
  }

  async cacheData(key, data, expiryMinutes = 60) {
    const transaction = this.db.transaction(['cachedData'], 'readwrite');
    const store = transaction.objectStore('cachedData');
    return store.put({
      key,
      data,
      expiry: Date.now() + (expiryMinutes * 60 * 1000)
    });
  }

  async getCachedData(key) {
    const transaction = this.db.transaction(['cachedData'], 'readonly');
    const store = transaction.objectStore('cachedData');
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        if (result && result.expiry > Date.now()) {
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearExpiredCache() {
    const transaction = this.db.transaction(['cachedData'], 'readwrite');
    const store = transaction.objectStore('cachedData');
    const index = store.index('expiry');
    
    return new Promise((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.upperBound(Date.now()));
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineStorage = new OfflineStorage();
