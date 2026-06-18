(function() {
  let currentVideo = null;
  let autoPlayEnabled = true;
  let saveRecordEnabled = true;
  let loopPlayEnabled = false;

  async function init() {
    const settings = await PlayStorage.getSettings();
    autoPlayEnabled = settings.autoPlay;
    saveRecordEnabled = settings.saveRecord;
    loopPlayEnabled = settings.loopPlay;

    setupEventListeners();
    setupAntiIdle();
    waitForVideo();
  }

  function setupAntiIdle() {
    // 模拟鼠标移动，防止"长时间未操作"检测
    setInterval(() => {
      const event = new MouseEvent('mousemove', {
        clientX: Math.random() * window.innerWidth,
        clientY: Math.random() * window.innerHeight,
        bubbles: true
      });
      document.dispatchEvent(event);
    }, 30000);

    // 自动点击"继续学习"等弹窗
    const observer = new MutationObserver(() => {
      document.querySelectorAll('button, .btn, [class*="confirm"], [class*="continue"]').forEach(btn => {
        const text = btn.textContent.toLowerCase();
        if (text.includes('继续') || text.includes('确') || text.includes('ok') || text.includes('yes')) {
          btn.click();
        }
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // 检测视频暂停后自动恢复
    setInterval(() => {
      document.querySelectorAll('video').forEach(video => {
        if (!video.paused && video.muted) {
          // 视频正在播放，保持状态
        } else if (video.paused && autoPlayEnabled) {
          video.muted = true;
          video.play().catch(() => {});
        }
      });
    }, 5000);
  }

  function waitForVideo() {
    const checkVideo = () => {
      const video = window.siteAdapter.getVideoElement();
      if (video && video !== currentVideo) {
        currentVideo = video;
        onVideoReady(video);
      }
    };

    checkVideo();
    const observer = new MutationObserver(checkVideo);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  async function onVideoReady(video) {
    const url = video.src || video.currentSrc;
    if (!url) return;

    if (saveRecordEnabled) {
      const record = await PlayStorage.getRecord(url);
      if (record && record.position > 0) {
        video.currentTime = record.position;
        console.log(`[Video Player] 恢复播放位置: ${formatTime(record.position)}`);
      }
    }

    if (autoPlayEnabled) {
      video.muted = true;
      video.play().then(() => {
        console.log('[Video Player] 静音自动播放成功');
      }).catch(() => {
        console.log('[Video Player] 自动播放被阻止');
      });
    }

    if (loopPlayEnabled) {
      video.loop = true;
    }

    video.addEventListener('timeupdate', () => {
      if (saveRecordEnabled) {
        saveProgress(video, url);
      }
    });

    video.addEventListener('ended', () => {
      if (loopPlayEnabled) {
        video.play();
      }
    });

    window.playerUI.setVideo(video);
  }

  const saveProgress = debounce((video, url) => {
    PlayStorage.saveRecord(url, video.currentTime, video.duration);
  }, 5000);

  function setupEventListeners() {
    window.addEventListener('video-found', (e) => {
      console.log('[Video Player] 发现视频:', e.detail.name);
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'get-videos':
          sendResponse({ videos: window.videoDetector.getAllVideos() });
          break;

        case 'play-video':
          const videoInfo = window.videoDetector.getVideoByIndex(message.index);
          if (videoInfo) {
            window.playerUI.setVideo(videoInfo.element);
            videoInfo.element.play();
          }
          break;

        case 'play-from-list':
          PlayStorage.addToPlaylist({ url: message.url });
          break;

        case 'play-all':
          const videos = window.videoDetector.getAllVideos();
          if (videos.length > 0) {
            window.playerUI.setVideo(
              window.videoDetector.getVideoByIndex(0).element
            );
          }
          break;

        case 'settings-updated':
          autoPlayEnabled = message.settings.autoPlay;
          saveRecordEnabled = message.settings.saveRecord;
          loopPlayEnabled = message.settings.loopPlay;
          if (currentVideo) {
            currentVideo.loop = loopPlayEnabled;
          }
          break;
      }
    });
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
