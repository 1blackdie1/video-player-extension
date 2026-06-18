document.addEventListener('DOMContentLoaded', async () => {
  const videoCountEl = document.getElementById('video-count');
  const pageVideosEl = document.getElementById('page-videos');
  const playlistEl = document.getElementById('playlist');
  const autoPlayCheckbox = document.getElementById('auto-play');
  const saveRecordCheckbox = document.getElementById('save-record');
  const loopPlayCheckbox = document.getElementById('loop-play');
  const defaultSpeedSelect = document.getElementById('default-speed');
  const btnClearList = document.getElementById('btn-clear-list');
  const btnPlayAll = document.getElementById('btn-play-all');

  let currentTab = null;

  async function init() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;

    await loadSettings();
    await loadPageVideos();
    await loadPlaylist();
  }

  async function loadSettings() {
    const data = await chrome.storage.local.get(['settings']);
    const settings = data.settings || {
      autoPlay: true,
      saveRecord: true,
      loopPlay: false,
      defaultSpeed: 1
    };

    autoPlayCheckbox.checked = settings.autoPlay;
    saveRecordCheckbox.checked = settings.saveRecord;
    loopPlayCheckbox.checked = settings.loopPlay;
    defaultSpeedSelect.value = settings.defaultSpeed;
  }

  async function saveSettings() {
    const settings = {
      autoPlay: autoPlayCheckbox.checked,
      saveRecord: saveRecordCheckbox.checked,
      loopPlay: loopPlayCheckbox.checked,
      defaultSpeed: parseFloat(defaultSpeedSelect.value)
    };
    await chrome.storage.local.set({ settings });

    chrome.tabs.sendMessage(currentTab.id, { type: 'settings-updated', settings });
  }

  async function loadPageVideos() {
    try {
      const response = await chrome.tabs.sendMessage(currentTab.id, { type: 'get-videos' });
      if (response && response.videos) {
        videoCountEl.textContent = response.videos.length;
        pageVideosEl.innerHTML = '';

        response.videos.forEach((video, index) => {
          const li = document.createElement('li');
          li.innerHTML = `
            <span class="video-name">${video.name || `视频 ${index + 1}`}</span>
            <span class="video-progress">${video.progress || '0%'}</span>
          `;
          li.addEventListener('click', () => {
            chrome.tabs.sendMessage(currentTab.id, {
              type: 'play-video',
              index: video.index
            });
          });
          pageVideosEl.appendChild(li);
        });
      }
    } catch (e) {
      console.log('无法获取视频列表');
    }
  }

  async function loadPlaylist() {
    const data = await chrome.storage.local.get(['playlist']);
    const playlist = data.playlist || [];
    playlistEl.innerHTML = '';

    playlist.forEach((item, index) => {
      const li = document.createElement('li');
      li.draggable = true;
      li.dataset.index = index;
      li.innerHTML = `
        <span class="video-name">${item.name || item.url.split('/').pop()}</span>
        <span class="video-progress">${item.progress || '0%'}</span>
      `;

      li.addEventListener('dragstart', handleDragStart);
      li.addEventListener('dragover', handleDragOver);
      li.addEventListener('drop', handleDrop);
      li.addEventListener('click', () => {
        chrome.tabs.sendMessage(currentTab.id, {
          type: 'play-from-list',
          url: item.url
        });
      });

      playlistEl.appendChild(li);
    });
  }

  let dragIndex = null;

  function handleDragStart(e) {
    dragIndex = parseInt(e.target.dataset.index);
    e.target.style.opacity = '0.5';
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  async function handleDrop(e) {
    e.preventDefault();
    const targetIndex = parseInt(e.target.closest('li').dataset.index);

    if (dragIndex !== null && dragIndex !== targetIndex) {
      const data = await chrome.storage.local.get(['playlist']);
      const playlist = data.playlist || [];

      const [removed] = playlist.splice(dragIndex, 1);
      playlist.splice(targetIndex, 0, removed);

      await chrome.storage.local.set({ playlist });
      await loadPlaylist();
    }

    dragIndex = null;
  }

  autoPlayCheckbox.addEventListener('change', saveSettings);
  saveRecordCheckbox.addEventListener('change', saveSettings);
  loopPlayCheckbox.addEventListener('change', saveSettings);
  defaultSpeedSelect.addEventListener('change', saveSettings);

  btnClearList.addEventListener('click', async () => {
    await chrome.storage.local.set({ playlist: [] });
    await loadPlaylist();
  });

  btnPlayAll.addEventListener('click', () => {
    chrome.tabs.sendMessage(currentTab.id, { type: 'play-all' });
  });

  init();
});
