class SyncQueue {
  constructor() {
    this.queue = this.loadQueue();
    this.syncing = false;
    this.listeners = [];
  }

  loadQueue() {
    try {
      const stored = localStorage.getItem('ppoint_sync_queue');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  saveQueue() {
    localStorage.setItem('ppoint_sync_queue', JSON.stringify(this.queue));
  }

  add(action) {
    const item = {
      id: `${Date.now()}-${Math.random()}`,
      action,
      timestamp: Date.now(),
      retries: 0,
      status: 'pending',
    };
    this.queue.push(item);
    this.saveQueue();
    this.notifyListeners();
    return item.id;
  }

  async syncAll() {
    if (this.syncing || !navigator.onLine) return;

    this.syncing = true;
    const pendingItems = this.queue.filter(item => item.status === 'pending');

    for (const item of pendingItems) {
      try {
        await this.executeAction(item.action);
        item.status = 'synced';
        item.syncedAt = Date.now();
      } catch (error) {
        item.retries++;
        if (item.retries >= 3) {
          item.status = 'failed';
        }
      }
    }

    this.saveQueue();
    this.notifyListeners();
    this.syncing = false;

    // Clean up synced items older than 24 hours
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.queue = this.queue.filter(item =>
      !(item.status === 'synced' && item.syncedAt < oneDayAgo)
    );
    this.saveQueue();
  }

  async executeAction(action) {
    const { type, data } = action;

    switch (type) {
      case 'create_address':
        return fetch('/api/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

      case 'verify_address':
        return fetch(`/api/addresses/${data.code}/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

      case 'report_address':
        return fetch('/api/addresses/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

      case 'update_location':
        return fetch('/api/tracking/location/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

      default:
        throw new Error(`Unknown action type: ${type}`);
    }
  }

  getQueue() {
    return [...this.queue];
  }

  getPendingCount() {
    return this.queue.filter(item => item.status === 'pending').length;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.getQueue()));
  }

  clear() {
    this.queue = [];
    this.saveQueue();
    this.notifyListeners();
  }
}

export const syncQueue = new SyncQueue();

// Auto-sync when connection restores
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncQueue.syncAll();
  });
}
