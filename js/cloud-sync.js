/**
 * BillBook SaaS - Firebase Cloud Sync & State Manager
 * Integrated with Firebase Realtime Database: https://adonaibroadcast-11095.firebaseio.com/billbook
 * Official Payment UPI ID: joy.john@ybl (Joy John)
 */

(function (window) {
  'use strict';

  const FIREBASE_BASE_URL = 'https://adonaibroadcast-11095.firebaseio.com/billbook';
  const LOCAL_STORAGE_KEY = 'billbook_data_v1';
  const UPI_ID = 'joy.john@ybl';
  const UPI_RECIPIENT_NAME = 'Joy John';

  let currentData = null;
  let isSyncing = false;
  let lastSyncTime = null;

  const CloudSync = {
    UPI_CONFIG: {
      upiId: UPI_ID,
      recipientName: UPI_RECIPIENT_NAME,
      currency: 'INR'
    },

    /**
     * Initialize Local & Remote Database State
     */
    async init() {
      // 1. Try Local Storage first
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        try {
          currentData = JSON.parse(cached);
          console.log('[CloudSync] Loaded data from local cache');
        } catch (e) {
          console.warn('[CloudSync] Corrupted local cache, will reseed', e);
        }
      }

      // 2. Fallback to embedded seed dataset (supports file:// protocol)
      if (!currentData || !currentData.business) {
        if (window.BILLBOOK_DEFAULT_DATA) {
          currentData = JSON.parse(JSON.stringify(window.BILLBOOK_DEFAULT_DATA));
          this.saveLocal();
          console.log('[CloudSync] Initialized from embedded seed dataset');
        } else {
          // 3. Try fetching seed_data.json via HTTP
          try {
            const res = await fetch('seed_data.json');
            if (res.ok) {
              currentData = await res.json();
              this.saveLocal();
              console.log('[CloudSync] Initialized from seed_data.json');
            }
          } catch (e) {
            console.error('[CloudSync] Failed to fetch seed_data.json', e);
          }
        }
      }

      // 4. Attempt Firebase cloud fetch in background (non-blocking)
      this.syncFromCloud().catch(err => {
        console.log('[CloudSync] Firebase sync in offline/standalone mode:', err.message);
      });

      return currentData;
    },

    /**
     * Get Current Memory State
     */
    getData() {
      return currentData;
    },

    /**
     * Persist to LocalStorage
     */
    saveLocal() {
      if (currentData) {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentData));
          this.updateSyncUI(true, 'Saved Locally');
        } catch (e) {
          console.warn('[CloudSync] LocalStorage error:', e);
        }
      }
    },

    /**
     * Push entire state to Firebase Realtime Database
     */
    async pushToCloud() {
      if (!currentData) return false;
      isSyncing = true;
      this.updateSyncUI(true, 'Syncing to Cloud...');

      try {
        const response = await fetch(`${FIREBASE_BASE_URL}.json`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(currentData)
        });

        if (!response.ok) {
          throw new Error(`Cloud error ${response.status}: ${response.statusText}`);
        }

        lastSyncTime = new Date();
        this.updateSyncUI(true, 'Cloud Synced');
        console.log('[CloudSync] Successfully pushed to Firebase Realtime Database');
        return true;
      } catch (err) {
        console.warn('[CloudSync] Cloud push notice:', err.message);
        this.updateSyncUI(false, 'Local Fast Cache (Online)');
        return false;
      } finally {
        isSyncing = false;
      }
    },

    /**
     * Fetch latest state from Firebase Realtime Database
     */
    async syncFromCloud() {
      try {
        const res = await fetch(`${FIREBASE_BASE_URL}.json?shallow=false`);
        if (res.ok) {
          const cloudData = await res.json();
          if (cloudData && cloudData.business) {
            currentData = cloudData;
            this.saveLocal();
            this.updateSyncUI(true, 'Cloud Synced');
            console.log('[CloudSync] Updated state from Firebase');
            return true;
          }
        }
      } catch (e) {
        console.log('[CloudSync] Cloud sync notice:', e.message);
      }
      this.updateSyncUI(true, 'Local Fast Cache');
      return false;
    },

    /**
     * Save data and trigger background cloud sync
     */
    commit(updatedData) {
      if (updatedData) {
        currentData = updatedData;
      }
      this.saveLocal();
      this.pushToCloud();
    },

    /**
     * Update UI Sync Pill
     */
    updateSyncUI(isOk, text) {
      const pill = document.getElementById('cloudSyncPill');
      const textSpan = document.getElementById('cloudSyncText');
      if (pill && textSpan) {
        textSpan.textContent = text;
        if (isOk) {
          pill.style.background = 'var(--success-light)';
          pill.style.color = 'var(--success)';
        } else {
          pill.style.background = 'var(--warning-light)';
          pill.style.color = '#b45309';
        }
      }
    }
  };

  window.CloudSync = CloudSync;
})(window);
