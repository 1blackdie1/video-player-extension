class PlayerUI {
  constructor() {
    this.panel = null;
    this.currentVideo = null;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.init();
  }

  init() {
    this.createPanel();
    this.bindEvents();
    this.setupShortcuts();
  }

  createPanel() {
    this.panel = document.createElement('div');
    this.panel.id = 'video-player-panel';
    this.panel.innerHTML = `
      <div class="vp-controls">
        <button class="vp-btn" id="vp-play" title="播放/暂停">▶</button>
        <button class="vp-btn" id="vp-backward" title="快退10秒">◀◀</button>
        <button class="vp-btn" id="vp-forward" title="快进10秒">▶▶</button>
        <div class="vp-volume">
          <button class="vp-btn" id="vp-mute" title="静音">🔊</button>
          <input type="range" id="vp-volume-slider" min="0" max="100" value="100">
        </div>
        <select id="vp-speed" title="倍速">
          <option value="0.5">0.5x</option>
          <option value="0.75">0.75x</option>
          <option value="1" selected>1.0x</option>
          <option value="1.25">1.25x</option>
          <option value="1.5">1.5x</option>
          <option value="2">2.0x</option>
        </select>
        <button class="vp-btn" id="vp-fullscreen" title="全屏">⛶</button>
      </div>
      <div class="vp-progress">
        <span id="vp-current-time">0:00</span>
        <input type="range" id="vp-progress-bar" min="0" max="100" value="0">
        <span id="vp-duration">0:00</span>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #video-player-panel {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.85);
        border-radius: 12px;
        padding: 12px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: #fff;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        opacity: 0.3;
        transition: opacity 0.3s;
        min-width: 280px;
        user-select: none;
      }
      #video-player-panel:hover {
        opacity: 1;
      }
      .vp-controls {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      .vp-btn {
        background: none;
        border: none;
        color: #fff;
        font-size: 16px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: background 0.2s;
      }
      .vp-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      .vp-volume {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      #vp-volume-slider {
        width: 60px;
        height: 4px;
        accent-color: #00d4ff;
      }
      #vp-speed {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: #fff;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
      }
      .vp-progress {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
      }
      #vp-progress-bar {
        flex: 1;
        height: 4px;
        accent-color: #00d4ff;
      }
      #vp-current-time, #vp-duration {
        min-width: 40px;
        text-align: center;
        color: #aaa;
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(this.panel);
  }

  bindEvents() {
    const playBtn = document.getElementById('vp-play');
    const backwardBtn = document.getElementById('vp-backward');
    const forwardBtn = document.getElementById('vp-forward');
    const muteBtn = document.getElementById('vp-mute');
    const volumeSlider = document.getElementById('vp-volume-slider');
    const speedSelect = document.getElementById('vp-speed');
    const fullscreenBtn = document.getElementById('vp-fullscreen');
    const progressBar = document.getElementById('vp-progress-bar');

    playBtn.addEventListener('click', () => this.togglePlay());
    backwardBtn.addEventListener('click', () => this.seek(-10));
    forwardBtn.addEventListener('click', () => this.seek(10));
    muteBtn.addEventListener('click', () => this.toggleMute());
    volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value / 100));
    speedSelect.addEventListener('change', (e) => this.setSpeed(e.target.value));
    fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    progressBar.addEventListener('input', (e) => this.seekTo(e.target.value));

    this.panel.addEventListener('mousedown', (e) => {
      if (e.target === this.panel || e.target.closest('.vp-controls') === null) {
        this.startDrag(e);
      }
    });

    document.addEventListener('mousemove', (e) => this.drag(e));
    document.addEventListener('mouseup', () => this.stopDrag());
  }

  setupShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          this.togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.seek(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.seek(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.adjustVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.adjustVolume(-0.1);
          break;
        case '<':
          e.preventDefault();
          this.adjustSpeed(-0.25);
          break;
        case '>':
          e.preventDefault();
          this.adjustSpeed(0.25);
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          this.toggleMute();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          this.toggleFullscreen();
          break;
      }
    });
  }

  setVideo(video) {
    this.currentVideo = video;
    this.panel.style.display = 'block';
    this.updateUI();

    video.addEventListener('timeupdate', () => this.updateProgress());
    video.addEventListener('play', () => this.updatePlayButton());
    video.addEventListener('pause', () => this.updatePlayButton());
    video.addEventListener('loadedmetadata', () => this.updateDuration());

    this.loadSettings();
  }

  async loadSettings() {
    const data = await chrome.storage.local.get(['settings']);
    const settings = data.settings || {};
    if (settings.defaultSpeed) {
      this.setSpeed(settings.defaultSpeed);
      document.getElementById('vp-speed').value = settings.defaultSpeed;
    }
  }

  togglePlay() {
    if (!this.currentVideo) return;
    if (this.currentVideo.paused) {
      this.currentVideo.play();
    } else {
      this.currentVideo.pause();
    }
  }

  seek(seconds) {
    if (!this.currentVideo) return;
    this.currentVideo.currentTime += seconds;
  }

  seekTo(percent) {
    if (!this.currentVideo || !this.currentVideo.duration) return;
    this.currentVideo.currentTime = (percent / 100) * this.currentVideo.duration;
  }

  setVolume(value) {
    if (!this.currentVideo) return;
    this.currentVideo.volume = Math.max(0, Math.min(1, value));
    this.currentVideo.muted = false;
    this.updateVolumeIcon();
  }

  adjustVolume(delta) {
    if (!this.currentVideo) return;
    this.setVolume(this.currentVideo.volume + delta);
    document.getElementById('vp-volume-slider').value = this.currentVideo.volume * 100;
  }

  toggleMute() {
    if (!this.currentVideo) return;
    this.currentVideo.muted = !this.currentVideo.muted;
    this.updateVolumeIcon();
  }

  setSpeed(speed) {
    if (!this.currentVideo) return;
    this.currentVideo.playbackRate = parseFloat(speed);
  }

  adjustSpeed(delta) {
    if (!this.currentVideo) return;
    const newSpeed = Math.max(0.5, Math.min(2, this.currentVideo.playbackRate + delta));
    this.setSpeed(newSpeed);
    document.getElementById('vp-speed').value = newSpeed;
  }

  toggleFullscreen() {
    if (!this.currentVideo) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      this.currentVideo.requestFullscreen();
    }
  }

  updateUI() {
    this.updatePlayButton();
    this.updateVolumeIcon();
  }

  updatePlayButton() {
    const playBtn = document.getElementById('vp-play');
    playBtn.textContent = this.currentVideo.paused ? '▶' : '⏸';
  }

  updateVolumeIcon() {
    const muteBtn = document.getElementById('vp-mute');
    if (this.currentVideo.muted || this.currentVideo.volume === 0) {
      muteBtn.textContent = '🔇';
    } else if (this.currentVideo.volume < 0.5) {
      muteBtn.textContent = '🔉';
    } else {
      muteBtn.textContent = '🔊';
    }
  }

  updateProgress() {
    if (!this.currentVideo || !this.currentVideo.duration) return;
    const percent = (this.currentVideo.currentTime / this.currentVideo.duration) * 100;
    document.getElementById('vp-progress-bar').value = percent;
    document.getElementById('vp-current-time').textContent = this.formatTime(this.currentVideo.currentTime);
  }

  updateDuration() {
    if (!this.currentVideo) return;
    document.getElementById('vp-duration').textContent = this.formatTime(this.currentVideo.duration);
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  startDrag(e) {
    this.isDragging = true;
    const rect = this.panel.getBoundingClientRect();
    this.dragOffset.x = e.clientX - rect.left;
    this.dragOffset.y = e.clientY - rect.top;
  }

  drag(e) {
    if (!this.isDragging) return;
    const x = e.clientX - this.dragOffset.x;
    const y = e.clientY - this.dragOffset.y;
    this.panel.style.left = `${x}px`;
    this.panel.style.top = `${y}px`;
    this.panel.style.right = 'auto';
    this.panel.style.bottom = 'auto';
  }

  stopDrag() {
    this.isDragging = false;
  }

  hide() {
    this.panel.style.display = 'none';
  }

  show() {
    this.panel.style.display = 'block';
  }
}

window.playerUI = new PlayerUI();
