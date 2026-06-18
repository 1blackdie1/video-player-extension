class VideoDetector {
  constructor() {
    this.videos = new Set();
    this.videoList = [];
    this.observer = null;
    this.init();
  }

  init() {
    this.observer = new MutationObserver(() => this.scan());
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    this.scan();
  }

  scan() {
    const allVideos = document.querySelectorAll('video');
    allVideos.forEach((video, index) => {
      if (!this.videos.has(video)) {
        this.videos.add(video);
        this.onVideoFound(video, index);
      }
    });
  }

  onVideoFound(video, index) {
    const videoInfo = {
      element: video,
      index: this.videoList.length,
      name: this.getVideoName(video),
      url: video.src || video.currentSrc || '',
      progress: '0%'
    };

    this.videoList.push(videoInfo);
    window.dispatchEvent(new CustomEvent('video-found', { detail: videoInfo }));
  }

  getVideoName(video) {
    if (video.title) return video.title;
    if (video.src) {
      const url = video.src;
      const filename = url.split('/').pop().split('?')[0];
      return filename || `视频 ${this.videoList.length + 1}`;
    }
    return `视频 ${this.videoList.length + 1}`;
  }

  getVideoByIndex(index) {
    return this.videoList[index] || null;
  }

  getAllVideos() {
    return this.videoList.map((info, index) => ({
      index,
      name: info.name,
      url: info.url,
      progress: this.getProgress(info.element)
    }));
  }

  getProgress(video) {
    if (!video.duration) return '0%';
    const percent = Math.round((video.currentTime / video.duration) * 100);
    return `${percent}%`;
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

window.videoDetector = new VideoDetector();
