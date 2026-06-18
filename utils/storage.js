class PlayStorage {
  static async getSettings() {
    const data = await chrome.storage.local.get(['settings']);
    return data.settings || {
      autoPlay: true,
      saveRecord: true,
      loopPlay: false,
      defaultSpeed: 1
    };
  }

  static async saveSettings(settings) {
    await chrome.storage.local.set({ settings });
  }

  static async saveRecord(url, position, duration) {
    const data = await chrome.storage.local.get(['playRecord']);
    const records = data.playRecord || {};
    records[url] = {
      position,
      duration,
      timestamp: Date.now()
    };
    await chrome.storage.local.set({ playRecord: records });
  }

  static async getRecord(url) {
    const data = await chrome.storage.local.get(['playRecord']);
    return data.playRecord?.[url] || null;
  }

  static async getAllRecords() {
    const data = await chrome.storage.local.get(['playRecord']);
    return data.playRecord || {};
  }

  static async clearRecords() {
    await chrome.storage.local.set({ playRecord: {} });
  }

  static async addToPlaylist(item) {
    const data = await chrome.storage.local.get(['playlist']);
    const playlist = data.playlist || [];
    const exists = playlist.some(p => p.url === item.url);
    if (!exists) {
      playlist.push({
        url: item.url,
        name: item.name || item.url.split('/').pop(),
        addedAt: Date.now()
      });
      await chrome.storage.local.set({ playlist });
    }
  }

  static async removeFromPlaylist(url) {
    const data = await chrome.storage.local.get(['playlist']);
    const playlist = (data.playlist || []).filter(p => p.url !== url);
    await chrome.storage.local.set({ playlist });
  }

  static async getPlaylist() {
    const data = await chrome.storage.local.get(['playlist']);
    return data.playlist || [];
  }

  static async clearPlaylist() {
    await chrome.storage.local.set({ playlist: [] });
  }

  static async reorderPlaylist(newOrder) {
    await chrome.storage.local.set({ playlist: newOrder });
  }
}

window.PlayStorage = PlayStorage;
